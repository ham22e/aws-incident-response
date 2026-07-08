# 위협 인텔리전스 브리프: 클라우드 인스턴스 자격증명 탈취

## TTP 요약 (ATT&CK Cloud)

| 전술 | 기법 | ID |
|------|------|----|
| Initial Access | Exploit Public-Facing Application (CVE-2025-29927) | T1190 |
| Privilege Escalation | Sudo and Sudo Caching (GTFOBins `find`) | T1548.003 |
| Credential Access | OS Credential Dumping: /etc/passwd and /etc/shadow | T1003.008 |
| Credential Access | Cloud Instance Metadata API | T1552.005 |
| Defense Evasion | Valid Accounts: Cloud | T1078.004 |
| Discovery | Cloud Infrastructure Discovery | T1580 |
| Discovery | Cloud Storage Object Discovery | T1619 |
| Collection | Data from Cloud Storage | T1530 |

## 실제 사례 연관

### Capital One (2019)
공개된 EC2의 SSRF 취약점(오구성된 WAF)을 통해 IMDS에서 IAM 역할 자격증명을 탈취하고 S3에서
약 1억 건 규모의 데이터를 유출한 사건. 본 분석 환경의 "IMDS 자격증명 탈취 → S3 유출" 흐름과 동일하다.
차이점: Capital One은 SSRF였으므로 IMDSv2가 유효한 완화책이었다. 본 분석 환경은 RCE 기반이라 IMDSv2의
효과가 제한적이고 IAM 최소권한이 더 결정적이다. 즉 공격 벡터에 따라 효과적인 통제가 다르다.

### TeamTNT (지속적 캠페인)
침해한 리눅스/컨테이너 호스트에서 클라우드 자격증명(환경변수, 파일, IMDS)을 자동 수집하는
크리덴셜 하베스팅으로 알려진 위협 활동. 본 분석 환경의 "호스트 장악 후 인스턴스 자격증명 수집" 패턴과
기법이 일치한다.

> 사실관계는 공개 사고 분석과 위협 인텔 보고서에 근거하며, 세부 수치/귀속은 1차 출처로 재확인이
> 필요하다. 본 분석 환경 관측은 특정 행위자로 단정하지 않으며 TTP 유사성만 제시한다.

## 방어 시사점

- 인스턴스 자격증명 탈취는 표적형(Capital One)과 상시형(TeamTNT) 모두에서 관측되는 보편적 패턴
  이므로, 단일 취약점 방어가 아니라 다층 통제가 필요하다.
- 최우선: IAM 최소권한(유출 blast radius 결정), 그다음 IMDSv2 강제(SSRF 계열 차단).
- 탐지: 인스턴스 역할 자격증명의 "AWS 외부 사용"을 상시 모니터링(GuardDuty
  `InstanceCredentialExfiltration.OutsideAWS`). 이는 벡터와 무관하게 탈취 후 오용 단계를 잡는다.
- 유출 단계 가시성 확보를 위해 CloudTrail S3 데이터 이벤트 로깅을 켠다(본 분석 환경도 이 덕분에 유출을
  타임라인으로 재구성했다).
