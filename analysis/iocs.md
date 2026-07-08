# 침해 지표 (IOC)

> 사고 ID: `CLOUDIR-2026-0709`
> 운영자 공인 IP와 임시키는 마스킹함. 원본은 gitignore된 `analysis/raw/`, `normalized.csv`.

## 네트워크

| 유형 | 값 | 비고 |
|------|-----|------|
| 공격자 IP | `203.0.113.42` | 최초 침투~유출 전 구간 동일 IP(문서용 예시 IP) |
| User-Agent | `aws-cli/2.x ... md/command#s3.cp ...` | 탈취키 사용 주체가 외부 워크스테이션의 aws-cli. EC2 내부 사용과 대비되는 강한 신호 |

## 자격증명 / 신원

| 유형 | 값 | 비고 |
|------|-----|------|
| 탈취 임시키 ID | `ASIA...` | EC2 역할의 임시 STS 키(마스킹). 만료 후 무효 |
| 사용된 역할 | `assumed-role/cloudir-ec2-role` | 인스턴스 역할이 외부 IP에서 사용됨 |

## 영향받은 리소스

| 리소스 | 값 |
|--------|-----|
| S3 버킷 | `cloudir-sensitive-111122223333` |
| 유출 객체 | `config/api_keys.txt`, `exports/customers.csv` |

## 행위 기반 지표 (탐지에 유용)

- `POST /api/internal/diagnostics` 요청에 위조된 `x-middleware-subrequest` 헤더(access log `mws` 필드) — 정상 트래픽에 없는 CVE-2025-29927 우회 마커
- `host` 파라미터에 셸 메타문자(`;`)나 `169.254.169.254`, `security-credentials`, `/dev/null` 포함
- `host` 파라미터에 `sudo`+`find`+`-exec` 조합(GTFOBins privesc 시도)
- `host` 파라미터에 `/etc/shadow` 열람(root 전용 로컬 자격증명 덤프 시도)
- 인스턴스 역할 자격증명(`ASIA...`)이 EC2가 아닌 외부 공인 IP에서 사용
- 짧은 시간 내 `ListObjects` 직후 다수 `GetObject`(정찰 후 즉시 유출)
- CloudTrail userAgent에 `md/command#s3.cp`, `md/command#s3.ls` 등 대화형 CLI 흔적

## ATT&CK 매핑

| 전술 | 기법 | ID |
|------|------|----|
| Initial Access | Exploit Public-Facing Application (CVE-2025-29927 인증 우회) | T1190 |
| Execution | Command and Scripting Interpreter: Unix Shell | T1059.004 |
| Privilege Escalation | Abuse Elevation Control Mechanism: Sudo and Sudo Caching | T1548.003 |
| Credential Access | OS Credential Dumping: /etc/passwd and /etc/shadow | T1003.008 |
| Credential Access | Unsecured Credentials: Cloud Instance Metadata API | T1552.005 |
| Defense Evasion / Persistence | Valid Accounts: Cloud Accounts | T1078.004 |
| Discovery | Cloud Infrastructure Discovery | T1580 |
| Discovery | Cloud Storage Object Discovery | T1619 |
| Collection | Data from Cloud Storage | T1530 |
