# GuardDuty 매핑

이 사고를 관리형 위협 탐지(Amazon GuardDuty)로 잡았다면 어떤 파인딩이 발생하는지 정리한다.
GuardDuty를 켜두면 아래 판정을 자동화할 수 있어, 커스텀 룰의 오탐(내부/AWS IP 구분)을 줄인다.

| 단계 | GuardDuty 파인딩 타입 | 의미 |
|------|------------------------|------|
| 자격증명 오용 | `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS` | EC2 인스턴스 역할 자격증명이 AWS 외부 IP에서 사용됨. 본 사고의 핵심과 정확히 일치 |
| 정찰/이상행위 | `Discovery:S3/AnomalousBehavior` | 평소와 다른 주체/패턴의 S3 열거 |
| 유출 | `Exfiltration:S3/AnomalousBehavior` | 비정상적 대량/외부 S3 객체 접근 |
| 자격증명 접근 | `CredentialAccess:IAMUser/AnomalousBehavior` | 자격증명 관련 이상 API 패턴 |

## 권고

- GuardDuty + S3 Protection 활성화. `InstanceCredentialExfiltration.OutsideAWS` 는 인스턴스
  자격증명 탈취의 사실상 표준 탐지이므로 우선 켠다.
- 파인딩을 EventBridge로 받아 SNS/Slack 통보 + 자동 대응(예: 해당 세션 무효화)으로 연결.
- 커스텀 Sigma 룰(`sigma/`)은 GuardDuty가 없거나 로그 기반 헌팅이 필요할 때의 보완재로 쓴다.
