# 분석 환경 배포 runbook

> 경고: 이 구성은 의도적으로 취약한 환경을 만든다. 반드시 본인 소유의 격리된 AWS 계정에서만,
> 교육/방어 목적으로 사용하고, 검증이 끝나면 즉시 `terraform destroy` 한다.

## 사전 준비

- AWS 계정(격리/개인 권장)과 CLI 자격증명 구성(`aws configure` 또는 프로파일)
- Terraform >= 1.14

## 설정

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 편집:
#   my_ip       = "$(curl -s ifconfig.me)/32"
#   aws_profile = 사용할 프로파일명 (기본 자격증명 쓰면 줄 삭제)
#   alert_email = 비용 경보 받을 이메일 (안 쓰면 줄 삭제)
```

## 배포

```bash
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

apply가 끝나면 출력에 `web_public_ip`, `sensitive_bucket` 등이 표시된다.

## 정상 동작 확인

```bash
IP=$(terraform output -raw web_public_ip)
# 앱 부팅(npm ci + next build)에 수 분 걸릴 수 있음
curl -s -o /dev/null -w "%{http_code}\n" "http://$IP/"   # 200이면 랜딩 정상
# 보호 API는 인증 우회 없이는 401 (미들웨어 차단이 정상)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://$IP/api/internal/diagnostics" \
  -H 'content-type: application/json' --data '{"host":"127.0.0.1"}'
```

콘솔에서 CloudTrail(이벤트 수집), CloudWatch Logs의 `/cloudir/vpc-flow-logs` 로그 그룹이
생성됐는지도 확인한다.

## 비용

- t3.micro 1대 + CloudTrail 데이터 이벤트 + Flow Logs + S3 소량.
- 몇 시간 켜두는 기준 대략 1~2 USD 미만(리전/계정 Free Tier 여부에 따라 다름).
- 방치 시 과금이 늘 수 있으니 사용 종료 후 즉시 파기.

## 파기

```bash
terraform destroy
```

S3 버킷은 `force_destroy = true`라 객체가 있어도 삭제된다. `destroy` 후 콘솔에서 EC2/버킷/트레일이
모두 제거됐는지 확인한다.

## 안전 체크리스트

- [ ] `my_ip`가 본인 IP `/32`로 제한되어 있는가(전 세계 개방 금지)
- [ ] S3 민감 데이터가 전부 합성 더미인가
- [ ] 사용 후 `terraform destroy` 완료
- [ ] `terraform.tfvars`, `*.tfstate`가 커밋되지 않았는가(`.gitignore` 적용 확인)
