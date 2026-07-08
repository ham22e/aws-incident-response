# 탐지·대응 운영 가이드

이 폴더는 "이 공격을 앞으로 어떻게 자동으로 탐지하고 막을 것인가"를 다룬다. 자료 유형별로
실제 사용 방식이 다르므로 아래 절차를 따른다.

| 자료 | 유형 | 실제 사용 방식 | 라이브 환경 필요 |
|------|------|----------------|----------------|
| `sigma/*.yml` | 탐지 룰(벤더 중립) | SIEM 쿼리로 변환 후 알람 등록 | 아니오(변환) / SIEM 필요(운영) |
| `queries.md` | Athena/Insights 쿼리 | 콘솔에서 직접 실행 | 예(로그 존재 시) |
| `guardduty.md` | 관리형 탐지 매핑 | GuardDuty 활성화 후 자동 finding | 예(재공격 시) |
| `hardening.md` | 재발 방지 diff | 코드 적용 후 재공격으로 검증 | 예 |

> 참고: `analysis/parse/hunt.py`가 이미 동일한 탐지 로직을 실제 수집 로그에 돌려 검증했다.
> 이 폴더는 그 로직을 SIEM/클라우드 운영 도구로 옮긴 것이다.

## 1. Sigma 룰을 SIEM에 배포

Sigma는 그 자체로 실행되지 않는다. `sigma-cli`로 대상 SIEM 언어로 변환한다.

```bash
pip install sigma-cli
sigma plugin install splunk        # 또는 elasticsearch, opensearch 등 대상 backend
sigma convert -t splunk detection/sigma/aws_instance_role_used_offbox.yml
```

- 출력된 쿼리를 SIEM의 저장 검색/알람으로 등록하면 실시간 탐지가 된다.
- 전제: CloudTrail/웹 access 로그가 그 SIEM에 수집되고 있어야 한다.
- 필드 매핑(예: CloudTrail `userIdentity.arn`)이 SIEM 인덱스와 다르면 backend 파이프라인으로
  조정한다.

## 2. 쿼리(Athena / CloudWatch Logs Insights) 실행

로그가 존재하는 라이브 환경에서 직접 실행한다(분석 환경을 destroy했으면 재배포 후, 또는 실제 사고 때).

- CloudTrail(Athena): CloudTrail 콘솔의 "Create Athena table" 로 테이블 생성 후 `queries.md`의
  SQL을 Athena 콘솔에서 실행.
- VPC Flow Logs(Insights): CloudWatch 콘솔 > Logs Insights > 로그 그룹 `/cloudir/vpc-flow-logs`
  선택 후 `queries.md`의 쿼리 실행.

## 3. GuardDuty 활성화

실행할 것은 없고 서비스만 켜면 된다.

```bash
aws guardduty create-detector --enable --region <region>
```

- S3 Protection을 함께 켠다. 이후 동일 공격을 재현하면 `guardduty.md`의 finding들(특히
  `InstanceCredentialExfiltration.OutsideAWS`)이 콘솔에 자동 생성된다.
- 그 finding을 캡처해 보고서/README에 넣으면 강력한 증거가 된다.
- 운영에서는 finding을 EventBridge로 받아 SNS/Slack 통보 또는 자동 대응(세션 무효화 등)으로 연결.

## 4. 하드닝 검증 (fix가 실제로 막는지)

`hardening.md`의 diff를 코드에 적용하고 재공격으로 차단을 확인한다.

```
hardening.md diff 적용(app/terraform) -> terraform apply -> 같은 공격 재실행
결과: RCE 실패(입력 검증) / 유출 차단(최소권한) / SSRF 계열 차단(IMDSv2)
```

## 권장 실행 순서

1. `sigma convert` 로 룰이 실제 SIEM 쿼리로 바뀌는 것을 보여준다(오프라인, 지금 가능).
2. GuardDuty를 켜고 분석 환경을 한 번 더 돌려 실제 finding을 캡처한다(임팩트 큼).
3. 하드닝 적용 후 재공격이 막히는 것을 보여준다(방어 완결).
