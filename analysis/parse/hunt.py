#!/usr/bin/env python3
"""정규화 이벤트에서 침해 신호를 헌팅하고 IOC를 요약한다.

표준 라이브러리만 사용한다. analysis/ 에서 실행:
    python3 parse/hunt.py                 # normalized.csv 분석 (시각 UTC)
    python3 parse/hunt.py --mask          # 공유용: 민감값(IP/UA/키/계정 ID) 마스킹 출력
    python3 parse/hunt.py --kst           # 시각을 KST(UTC+9)로 표시 (원본 UTC는 그대로)
"""
import argparse
import csv
import datetime
import ipaddress
import re

ROLE_MARKER_DEFAULT = "assumed-role/cloudir-ec2-role"
INJECTION_HINTS = ("169.254.169.254", "security-credentials", ";curl", ";id", ";uname", ";cat", "/dev/null", "/etc/shadow", "sudo -n")

# 공유용 마스킹 placeholder (커밋된 문서 iocs.md/timeline.md 컨벤션과 동일).
MASK_IP = "203.0.113.42"        # RFC 5737 TEST-NET-3
MASK_ACCT = "111122223333"      # AWS 문서 예시 계정 ID

KST = datetime.timezone(datetime.timedelta(hours=9))


def to_kst(s):
    """normalized.csv의 UTC 타임스탬프(2026-07-08T14:32:52Z)를 KST 표시로 변환.
    원본 값은 UTC 그대로 두고 출력 문자열만 바꾼다. 파싱 실패 시 원문 유지."""
    try:
        dt = datetime.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ")
    except ValueError:
        return s
    return dt.replace(tzinfo=datetime.timezone.utc).astimezone(KST).strftime("%Y-%m-%d %H:%M:%S KST")


def mask_ip(s):
    """공인(글로벌) IPv4만 예시 IP로 치환. 사설/loopback/link-local(169.254.*)/127.* 및 비IP 문자열은 유지."""
    try:
        if ipaddress.ip_address(s).is_global:
            return MASK_IP
    except ValueError:
        pass
    return s


def mask_key(s):
    """AWS 액세스 키 ID(ASIA/AKIA + 16자)를 접두 4자 뒤에서 절단."""
    return re.sub(r"\b(ASIA|AKIA)[A-Z0-9]{16}\b", r"\1...", s)


def mask_acct(s):
    """문자열 내 12자리 AWS 계정 ID(버킷명 등)를 예시 계정 ID로 치환."""
    return re.sub(r"\b\d{12}\b", MASK_ACCT, s)


_IPV4_RE = re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b")


def mask_ips_in(s):
    """문자열에 박힌 공인 IPv4만 예시 IP로 치환(사설/loopback/link-local은 유지).
    신호[1] target의 host 페이로드처럼 IP가 문자열 내부에 섞여 있을 때 쓴다."""
    def repl(m):
        try:
            return MASK_IP if ipaddress.ip_address(m.group(0)).is_global else m.group(0)
        except ValueError:
            return m.group(0)
    return _IPV4_RE.sub(repl, s)


def mask_ua(s):
    """워크스테이션 지문 토큰(cli/OS/arch/런타임 버전) 제거·일반화. 행위 토큰(md/command 등)은 유지."""
    s = re.sub(r"aws-cli/[0-9][0-9.]*", "aws-cli/2.x", s)
    s = re.sub(r"\s*os/\S+", "", s)
    s = re.sub(r"\s*md/arch#\S+", "", s)
    s = re.sub(r"\s*lang/python#[0-9][0-9.]*", "", s)
    s = re.sub(r"\s*md/awscrt#\S+", "", s)
    s = re.sub(r"\s*md/pyimpl#\S+", "", s)
    return s


def load(path):
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def is_injection(row):
    """초기 침투(진단 API 악용) 판정.
    조건: 진단 엔드포인트(/api/internal/diagnostics) 대상이면서 (CVE-2025-29927 우회 헤더 위조)
    또는 (host 페이로드에 주입 흔적). 정상 기준선 호출(우회 헤더 없음 + host=127.0.0.1)은 걸리지 않는다.
    """
    t = row["target"].lower()
    if "diagnostics" not in t:
        return False
    forged_mws = row.get("detail", "").startswith("mws=")  # 위조된 x-middleware-subrequest
    return forged_mws or (";" in t) or any(h in t for h in INJECTION_HINTS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", default="normalized.csv")
    ap.add_argument("--role", default=ROLE_MARKER_DEFAULT, help="인스턴스 역할 마커(arn 부분 문자열)")
    ap.add_argument("--mask", action="store_true", help="공유용: 민감값(IP/UA/키/계정 ID) 마스킹 출력")
    ap.add_argument("--kst", action="store_true", help="시각을 KST(UTC+9)로 표시 (원본 UTC는 그대로)")
    args = ap.parse_args()
    rows = load(args.inp)

    # 마스킹 on/off를 필드 래퍼로 바인딩(off면 항등함수). 마스킹은 출력 직전에만 적용, 헌팅 로직에는 영향 없음.
    if args.mask:
        mip, mua, mkey, macct = mask_ip, mask_ua, mask_key, mask_acct
        mtgt = lambda s: macct(mask_ips_in(s))   # 신호[1] target: 페이로드 내부 공인 IP/계정 ID 마스킹
    else:
        mip = mua = mkey = macct = lambda s: s
        mtgt = lambda s: s

    # 시각 표시: --kst면 KST로 변환, 아니면 UTC 원문 그대로. 출력 직전에만 적용.
    fts = to_kst if args.kst else (lambda s: s)

    # 1) 초기 침투: CVE-2025-29927 우회 + command injection / IMDS 탈취 요청(host 웹 로그)
    injections = [r for r in rows if r["source"] == "host-web" and is_injection(r)]
    attacker_ips = sorted({r["src_ip"] for r in injections})

    # 2) 탈취한 인스턴스 역할 자격증명의 외부(오프-인스턴스) 사용 = 강한 신호
    role_events = [r for r in rows if args.role in r["actor"]]
    offbox = [r for r in role_events if r["src_ip"] in attacker_ips]

    # 3) S3 데이터 유출
    exfil = [r for r in rows if r["action"].endswith(":GetObject")]

    line = "=" * 60
    print(line + "\n침해 헌팅 요약\n" + line)

    print("\n[1] 초기 침투 (command injection / IMDS 탈취): %d 건" % len(injections))
    for r in injections[:10]:
        print("    %s  %s  %s" % (fts(r["ts"]), mip(r["src_ip"]), mtgt(r["target"])[:90]))

    print("\n[2] 인스턴스 역할 자격증명의 외부 사용(강한 신호): %d 건" % len(offbox))
    for r in offbox[:15]:
        print("    %s  src=%s  ua=%s  %s" % (fts(r["ts"]), mip(r["src_ip"]), mua(r["user_agent"]), r["action"]))

    print("\n[3] S3 데이터 유출 (GetObject): %d 건" % len(exfil))
    for r in exfil[:15]:
        print("    %s  src=%s  %s" % (fts(r["ts"]), mip(r["src_ip"]), macct(r["target"])))

    print("\n" + line + "\nIOC 후보\n" + line)
    print("공격자 IP        :", ", ".join(sorted({mip(ip) for ip in attacker_ips})) or "(없음)")
    uas = sorted({mua(r["user_agent"]) for r in offbox if r["user_agent"]})
    print("탈취키 사용 UA   :", ", ".join(uas) or "(없음)")
    keys = sorted({mkey(r["detail"]) for r in offbox if r["detail"]})
    print("탈취 임시키 ID   :", ", ".join(keys) or "(없음)")
    objs = sorted({macct(r["target"]) for r in exfil if r["target"]})
    print("유출 객체        :", ", ".join(objs) or "(없음)")

    if not rows:
        print("\n[!] 이벤트가 없습니다. normalize.py 실행/로그 수집 여부 확인.")
    elif not exfil and not offbox:
        print("\n[!] CloudTrail 신호가 없습니다. 전달 지연(최대 15분)일 수 있으니 잠시 후 재수집.")


if __name__ == "__main__":
    main()
