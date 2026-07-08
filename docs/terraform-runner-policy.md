# Terraform 실행 권한 정책

이 분석 환경을 `terraform apply` / `terraform destroy` 하는 **운영자(본인)** IAM 사용자/역할에 붙이는
정책이다. 정책 본문은 `terraform-runner-policy.json`.

> 주의: 분석 환경 내부의 "의도적으로 과대권한인 EC2 역할"(`iam.tf`의 `s3:*`)과는 전혀 다른 것이다.
> 이 파일은 인프라를 만드는 신뢰된 운영자용 권한이고, 그 EC2 역할은 침해 재현 대상이다.

## 무엇을 허용하나

| 문(Sid) | 범위 | 이유 |
|---------|------|------|
| LabInfraServices | `ec2:*`, `s3:*`, `cloudtrail:*`, `logs:*` (Resource `*`) | VPC/EC2/보안그룹/Flow Log, S3 버킷+객체, CloudTrail, CloudWatch 로그 생성/삭제 |
| Budgets | `budgets:ViewBudget`, `budgets:ModifyBudget` + 태그(`TagResource`/`UntagResource`/`ListTagsForResource`) | 비용 경보 예산 생성/삭제. provider `default_tags`가 예산에도 태그를 달아 태그 액션 필요 |
| StsRead | `sts:GetCallerIdentity` | provider 프리플라이트 및 `data.aws_caller_identity` |
| SsmLogCollection | `ssm:SendCommand`/`GetCommandInvocation`/`DescribeInstanceInformation`/`StartSession` 등 | 분석 단계에서 EC2 호스트 로그를 SSM으로 수집 |
| ManageLabIamRoles | IAM 역할/인스턴스프로파일 관리, `cloudir-*` 로만 제한 | 분석 환경 역할 생성/삭제 (다른 역할은 건드리지 못함) |
| PassLabRolesToServices | `iam:PassRole` on `cloudir-*`, ec2/vpc-flow-logs 서비스로만 | EC2 인스턴스프로파일 연결, Flow Log 역할 전달 |

## 설계 관점 (least privilege)

- 가장 위험한 IAM 권한은 리소스를 `cloudir-*` 로 좁혀, 이 운영자 권한이 계정의 다른 IAM
  역할을 조작하지 못하게 했다. `iam:PassRole` 도 조건으로 특정 서비스에만 전달 가능하게 제한.
- 인프라 서비스(EC2/S3/CloudTrail/Logs)는 terraform이 호출하는 describe/create/delete 조합이
  넓어 서비스 단위로 부여했다. `AdministratorAccess` 보다는 크게 좁지만, 프로덕션이라면 액션과
  리소스를 더 세분화하고 리전 조건을 걸어 추가로 좁힐 수 있다.

## 전제 (prefix)

IAM 리소스 제한이 `cloudir-*` 라서, terraform의 `prefix` 변수 기본값(`cloudir`)을 그대로
쓸 때 동작한다. `prefix` 를 바꾸면 이 JSON의 `cloudir-*` 도 같이 바꿔야 한다.

## 연결 방법

루트 계정으로 실행한다면 이 정책은 필요 없다(루트는 전권). IAM 사용자/역할로 terraform을
돌릴 때만 붙인다.

```bash
# 1) 정책 생성
aws iam create-policy \
  --policy-name cloudir-terraform-runner \
  --policy-document file://docs/terraform-runner-policy.json
# 출력의 "Arn" 을 복사 (예: arn:aws:iam::<ACCOUNT_ID>:policy/cloudir-terraform-runner)

# 2) 본인 IAM 사용자에 연결 (사용자명 확인: aws iam get-user)
aws iam attach-user-policy \
  --user-name <YOUR_IAM_USER> \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/cloudir-terraform-runner
```

역할에 붙일 경우 `attach-role-policy --role-name <ROLE>` 를 사용한다.

## 검증

```bash
cd terraform
terraform plan   # 권한 부족 시 AccessDenied 로 어떤 액션이 빠졌는지 표시됨
```

`AccessDenied` 가 나면 메시지의 액션을 이 정책에 추가한다.
