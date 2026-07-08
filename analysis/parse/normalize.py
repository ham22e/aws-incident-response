#!/usr/bin/env python3
"""수집한 원본 로그(CloudTrail / host web / VPC Flow Logs)를 공통 이벤트 스키마로 정규화한다.

표준 라이브러리만 사용한다. analysis/ 에서 실행:
    python3 parse/normalize.py            # raw/ -> normalized.csv
"""
import argparse
import csv
import datetime
import glob
import json
import os
import re
from urllib.parse import unquote

FIELDS = ["ts", "source", "src_ip", "actor", "action", "target", "user_agent", "detail"]

# host 웹 access log 형식(Next.js app/webapp lib/accesslog.ts):
#   2026-07-08 06:23:57,123 203.0.113.42 "POST /api/internal/diagnostics" \
#     host="127.0.0.1 >/dev/null 2>&1;id" ua="curl/8.7 (lab-attacker)" mws="middleware:..."
# host="..." = command injection에 쓰인 host 파라미터(주입 페이로드),
# mws="..." = x-middleware-subrequest 헤더값(CVE-2025-29927 우회 마커).
# host/ua/mws 값 모두 큰따옴표를 포함할 수 있다(헤더·페이로드 유래). 세 필드를 greedy로 두고
# 고정 구분자(` ua="`, ` mws="`)와 끝 앵커(`"$`)로 마지막 경계에 바인딩한다. 따옴표가 섞여도
# 라인이 통째로 드롭되지 않는다(증거 유실 방지).
HOST_RE = re.compile(
    r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ (\S+) "(\S+) (.*?)" '
    r'host="(.*)" ua="(.*)" mws="(.*)"$'
)


def parse_cloudtrail(root):
    events = []
    for fp in glob.glob(os.path.join(root, "**", "*.json"), recursive=True):
        try:
            with open(fp) as f:
                data = json.load(f)
        except Exception:
            continue
        for r in data.get("Records", []):
            ui = r.get("userIdentity", {}) or {}
            rp = r.get("requestParameters") or {}
            target = ""
            if isinstance(rp, dict):
                bucket = rp.get("bucketName")
                key = rp.get("key")
                if bucket:
                    target = bucket + ("/" + key if key else "")
            events.append({
                "ts": r.get("eventTime", ""),
                "source": "cloudtrail",
                "src_ip": r.get("sourceIPAddress", ""),
                "actor": ui.get("arn") or ui.get("accessKeyId") or ui.get("type") or "unknown",
                "action": "%s:%s" % (r.get("eventSource", ""), r.get("eventName", "")),
                "target": target,
                "user_agent": r.get("userAgent", ""),
                "detail": ui.get("accessKeyId", ""),
            })
    return events


def parse_host(root):
    events = []
    for fp in glob.glob(os.path.join(root, "*")):
        if not os.path.isfile(fp):
            continue
        with open(fp, errors="replace") as f:
            for line in f:
                m = HOST_RE.match(line.strip())
                if not m:
                    continue
                dt, ip, method, path, host, ua, mws = m.groups()
                # target = 경로 + 주입 host 페이로드(있으면). 헌팅의 injection 판정 대상.
                # host 페이로드는 JSON 본문에서 그대로 기록된 원문이라 URL 디코드하지 않는다.
                target = unquote(path)
                if host:
                    target += ' host="%s"' % host
                # detail = CVE-2025-29927 우회 마커(위조된 x-middleware-subrequest 헤더값).
                events.append({
                    "ts": dt.replace(" ", "T") + "Z",
                    "source": "host-web",
                    "src_ip": ip,
                    "actor": ip,
                    "action": "HTTP:" + method,
                    "target": target,
                    "user_agent": ua,
                    "detail": ("mws=" + mws) if mws else "",
                })
    return events


def _iso(ms):
    return datetime.datetime.fromtimestamp(
        ms / 1000, datetime.timezone.utc
    ).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_flows(root):
    events = []
    fp = os.path.join(root, "flows.json")
    if not os.path.exists(fp):
        return events
    try:
        with open(fp) as f:
            data = json.load(f)
    except Exception:
        return events
    # VPC Flow Logs 기본 형식:
    # version account eni src dst srcport dstport proto pkts bytes start end action status
    for e in data.get("events", []):
        parts = str(e.get("message", "")).split()
        if len(parts) < 14:
            continue
        events.append({
            "ts": _iso(e.get("timestamp", 0)),
            "source": "flowlog",
            "src_ip": parts[3],
            "actor": parts[3],
            "action": "FLOW:" + parts[12],
            "target": "%s:%s" % (parts[4], parts[6]),
            "user_agent": "",
            "detail": "bytes=" + parts[9],
        })
    return events


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default="raw", help="원본 로그 디렉터리 (기본: raw)")
    ap.add_argument("--out", default="normalized.csv", help="출력 CSV (기본: normalized.csv)")
    args = ap.parse_args()

    events = []
    events += parse_cloudtrail(os.path.join(args.raw, "cloudtrail"))
    events += parse_host(os.path.join(args.raw, "host"))
    events += parse_flows(os.path.join(args.raw, "flowlogs"))
    events.sort(key=lambda e: e["ts"])

    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(events)

    counts = {}
    for e in events:
        counts[e["source"]] = counts.get(e["source"], 0) + 1
    print("normalized %d events -> %s" % (len(events), args.out))
    for src, cnt in sorted(counts.items()):
        print("  %-11s %d" % (src, cnt))


if __name__ == "__main__":
    main()
