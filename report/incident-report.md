# 침해사고 분석 보고서: AWS 인스턴스 자격증명 탈취 및 S3 데이터 유출

| 항목 | 값 |
|------|-----|
| 사고 ID | CLOUDIR-2026-0709 |
| 발생 일자 | 2026-07-09 (UTC) |
| 환경 | AWS 단일 계정 분석 환경(합성 데이터) |
| 분류 | 웹 취약점 악용 → 자격증명 탈취 → 클라우드 데이터 유출 |
| 심각도 | High |
| 상태 | 분석 완료, 자원 파기 |

> 고지: 본 사고는 통제된 환경에서 재현·분석한 것이며 유출된 데이터는 전부 합성 더미다.
> 공격자 IP/임시키는 마스킹했다. 근거 로그는 비공개(`analysis/raw/`, `normalized.csv`).

## 1. Executive Summary

2026-07-09, Cloud Ops 사내 운영 콘솔의 네트워크 진단 관리 도구(미들웨어 뒤 `/api/internal/diagnostics`)에
대해 CVE-2025-29927 미들웨어 인증 우회와 command injection이 연쇄되어 EC2 인스턴스에서 원격 코드 실행이
발생했다. RCE는 비권한 `nextjs` 계정으로
떨어졌고, sudo 오구성(`find` GTFOBins)으로 root까지 상승했다. 공격자는 IMDSv2에서 인스턴스 IAM
역할의 임시 자격증명을 탈취했고, 과대권한 정책을 악용해 S3 민감 버킷의 데이터 2건을 외부로
유출했다. 최초 침투(15:24:46 KST)부터 유출(15:32:02 KST)까지 체류 시간은 약 7분 16초였다.

근본 원인은 단일 결함이 아니라 (1) 미들웨어 단독 인증 + CVE-2025-29927, (2) 입력 미검증(command
injection), (3) sudo `find` NOPASSWD 오구성, (4) IMDS 자격증명 노출, (5) IAM 과대권한의 연쇄다.
어느 한 지점이라도 통제됐다면 유출은 발생하지 않았다.

## 2. 사고 개요 및 범위

- 대상: 퍼블릭 서브넷의 EC2 웹 인스턴스(`cloudir-web`)와 연결된 S3 버킷(`cloudir-sensitive-*`)
- 진입점: `POST /api/internal/diagnostics`(위조 `x-middleware-subrequest`로 미들웨어 우회 후 `host` 파라미터를 셸 명령에 그대로 전달)
- 영향 데이터: S3 객체 2건(합성 더미) - `config/api_keys.txt`, `exports/customers.csv`
- 범위: 단일 계정/단일 인스턴스. 측면 이동은 클라우드 제어평면(탈취 역할)을 통해 발생

## 3. 침해 타임라인 (KST, UTC+9 · 원본 로그는 UTC)

| 시각 | 단계 | 행위 | 근거 |
|------|------|------|------|
| 15:24:46 | 초기 침투 | CVE-2025-29927 우회 + command injection RCE(`;id`, `;uname -a`), 비권한 nextjs | host 웹 로그 |
| 15:26:34 | 권한 상승 | `sudo find ... -exec`(GTFOBins)로 nextjs→root, `/etc/shadow` 덤프 | host 웹 로그(주입 요청) |
| 15:29:06 | 자격증명 접근 | IMDSv2 토큰 발급 후 `security-credentials` 조회로 임시키 확보 | host 웹 로그 |
| 15:32:00 | 정찰 | 탈취 역할로 `s3 ls`(외부 IP/aws-cli) | CloudTrail |
| 15:32:02 | 유출 | `s3 cp` 로 객체 2건 다운로드(GetObject) | CloudTrail 데이터 이벤트 |

주: 수집 중 동일 역할의 `ssm:SendCommand` 가 외부 IP에서 CloudTrail에 관측될 수 있으나, 이는 공격이
아니라 분석자가 탈취 자격증명이 남은 셸로 수집을 시도한 흔적이다(본 검증에서도 재현). 탐지 이벤트에는
맥락(누가/왜)이 필요하다(상세: `analysis/timeline.md`).

## 4. 공격 분석 (킬체인 / MITRE ATT&CK)

1. Initial Access - 노출된 웹 콘솔 관리 API 악용(T1190, CVE-2025-29927 인증 우회) + Unix Shell 실행(T1059.004)
2. Privilege Escalation - sudo `find` GTFOBins로 nextjs→root(T1548.003)
3. Credential Access - root로 `/etc/shadow` 덤프, 로컬 계정 해시 탈취(T1003.008)
4. Credential Access - IMDS에서 자격증명 탈취(T1552.005). IMDSv2라도 온박스 RCE로 토큰 직접 발급
5. Defense Evasion/Persistence - 탈취한 유효 클라우드 자격증명 사용(T1078.004)
6. Discovery - S3 버킷/객체 열거(T1580, T1619)
7. Collection - 클라우드 스토리지 데이터 획득(T1530)

가장 강한 침해 신호: 인스턴스 역할의 임시 자격증명이 EC2 내부가 아닌 외부 공인 IP의
외부 워크스테이션 aws-cli에서 사용된 점.

## 5. 근본 원인 분석

다섯 결함의 연쇄(미들웨어 단독 인증 + CVE-2025-29927 → 미인증 접근, 입력 미검증 → RCE,
sudo `find` 오구성 → root 상승, IMDS 자격증명 노출 → 탈취, IAM 과대권한 → 유출 확대)가
결합했다. 상세와 차단 가능성은 `analysis/root_cause.md` 참조. 핵심 뉘앙스: 본 사고는 온박스
RCE 기반이라 IMDSv2만으로는 완전 방어가 어렵고, 유출 규모를 실제로 좌우한 통제는 IAM 최소권한이다.

## 6. 영향 평가

- 기밀성: S3 민감 객체 2건 유출(분석 환경에서는 합성 더미). 실제였다면 자격증명/고객정보 노출에 해당
- 무결성/가용성: 변조·삭제·서비스 중단은 관측되지 않음
- 확산: 탈취 역할의 권한 범위(계정 전체 S3)만큼 잠재적 확산 가능성이 있었음

## 7. 침해 지표(IOC)

요약: 공격자 IP `203.0.113.42`, 외부 워크스테이션 aws-cli User-Agent, 탈취 임시키 `ASIA...`,
영향 버킷 `cloudir-sensitive-111122223333`(객체 2건). 전체 목록: `analysis/iocs.md`.

## 8. 위협 인텔리전스

관측 TTP(웹 취약점 → IMDS 자격증명 탈취 → S3 유출)는 실제 클라우드 침해 캠페인과 일치한다.
상세 분석과 실제 사례 연관은 `report/threat-intel-brief.md` 참조.

## 9. 대응 및 재발 방지 권고

우선순위 순(상세 코드 변경: `detection/hardening.md`):
1. CVE-2025-29927 패치(Next.js ≥ 15.2.3) + 라우트 자체 인증
2. command injection 제거(`execFile`+인자 배열, host 형식 검증)
3. IAM 최소권한(필요한 버킷/액션만)
4. sudo `find` NOPASSWD 오구성 제거(privesc 차단)
5. IMDSv2 강제 + hop limit 1, 웹 서비스 저권한(`nextjs`) 실행 — 이미 적용됨, 유지
6. 탐지: GuardDuty `InstanceCredentialExfiltration.OutsideAWS` 활성화 + EventBridge 통보/자동대응,
   Sigma 룰(`detection/sigma/`)로 보완

## 10. 부록

- 분석 도구/쿼리: `analysis/parse/`(normalize, hunt), `detection/queries.md`(Athena/Insights)
- 환경 구성/공격 재현: `terraform/`, `attack/`
- 아키텍처: `docs/architecture.md`
