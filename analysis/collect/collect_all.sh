#!/bin/bash
# 로그 수집: EC2 호스트 로그(SSM) + CloudTrail(S3) + VPC Flow Logs(CloudWatch)
# analysis/ 디렉터리에서 실행. 결과는 analysis/raw/ (gitignore).
# 전제: 재현 환경이 apply된 상태, SSM 정책이 붙어 있고(agent 등록에 1~2분), aws cli 인증됨.
set -euo pipefail

TF="terraform -chdir=../terraform"
REGION=$($TF output -raw region)
INSTANCE_ID=$($TF output -raw web_instance_id)
TRAIL_BUCKET=$($TF output -raw trail_bucket)
FLOW_GROUP=$($TF output -raw flow_log_group)

mkdir -p raw/host raw/cloudtrail raw/flowlogs

echo "[*] (1/3) EC2 호스트 로그 수집 via SSM (instance: $INSTANCE_ID)"
CMD_ID=$(aws ssm send-command --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters '{"commands":["cat /var/log/webapp/access.log 2>/dev/null"]}' \
  --query "Command.CommandId" --output text)
aws ssm wait command-executed --region "$REGION" \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" 2>/dev/null || true
aws ssm get-command-invocation --region "$REGION" \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
  --query "StandardOutputContent" --output text > raw/host/webapp_access.log
echo "    -> raw/host/webapp_access.log ($(grep -c . raw/host/webapp_access.log || echo 0) lines)"
# (참고) journald가 필요하면: aws ssm start-session --target $INSTANCE_ID 로 접속해
#        journalctl -u nextjs 확인. 또는 위 commands에 journalctl 라인을 추가.

echo "[*] (2/3) CloudTrail 로그 수집 (s3://$TRAIL_BUCKET)"
echo "    참고: CloudTrail 전달은 최대 15분 지연. 유출 직후면 잠시 기다렸다 다시 실행."
aws s3 sync "s3://$TRAIL_BUCKET/AWSLogs/" raw/cloudtrail/ --region "$REGION" --quiet || true
find raw/cloudtrail -name '*.json.gz' -exec gunzip -kf {} \; 2>/dev/null || true
echo "    -> raw/cloudtrail/ ($(find raw/cloudtrail -name '*.json' | wc -l | tr -d ' ') json files)"

echo "[*] (3/3) VPC Flow Logs 수집 (CloudWatch: $FLOW_GROUP)"
aws logs filter-log-events --region "$REGION" \
  --log-group-name "$FLOW_GROUP" --output json > raw/flowlogs/flows.json || true
echo "    -> raw/flowlogs/flows.json"

echo "[+] 수집 완료. 다음: python3 parse/normalize.py && python3 parse/hunt.py"
