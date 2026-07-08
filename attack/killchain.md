# 킬체인 종합 + MITRE ATT&CK 매핑

## 전체 흐름

```
[운영자 IP]
   | (1) CVE-2025-29927 미들웨어 우회 + command injection -> RCE (T1190, T1059.004)
   v
[EC2 web / 비권한 nextjs]
   | (2) sudo find GTFOBins 로 root 상승 (T1548.003) + /etc/shadow 덤프 (T1003.008)
   v
[EC2 web / root]
   | (3) IMDSv2로 역할 임시키 탈취 (T1552.005)  ※ root 불필요, 온박스면 충분
   v
[탈취한 EC2 역할 자격증명] -- 운영자 로컬에서 사용
   | (4) sts/s3 열거 (T1078.004, T1580, T1619)
   v
[S3 sensitive 버킷]
   | (5) GetObject 유출 (T1530)
   v
[운영자 로컬 ./stolen/]
```

## 단계별 매핑

| # | 전술(Tactic) | 기법(Technique) | ID | 증거 소스 |
|---|--------------|-----------------|----|-----------|
| 1 | Initial Access | Exploit Public-Facing Application (CVE-2025-29927 인증 우회) | T1190 | 웹 access log(`mws` 필드) |
| 1 | Execution | Unix Shell | T1059.004 | 웹 access log(`host` 페이로드), journald |
| 2 | Privilege Escalation | Sudo and Sudo Caching (GTFOBins `find`) | T1548.003 | 웹 access log(주입 요청), sudo/auth 로그 |
| 2 | Credential Access | OS Credential Dumping: /etc/passwd and /etc/shadow | T1003.008 | 웹 access log(`/etc/shadow` 덤프 요청) |
| 3 | Credential Access | Cloud Instance Metadata API | T1552.005 | 웹 access log(IMDS 호출) |
| 4 | Defense Evasion / Persistence | Valid Accounts: Cloud | T1078.004 | CloudTrail(sts) |
| 4 | Discovery | Cloud Infrastructure Discovery | T1580 | CloudTrail(s3 ListBuckets) |
| 4 | Discovery | Cloud Storage Object Discovery | T1619 | CloudTrail(s3 ListObjects) |
| 5 | Collection | Data from Cloud Storage | T1530 | CloudTrail 데이터 이벤트, Flow Logs |

각 단계의 실제 실행 시각은 `analysis/timeline.md`의 재구성 타임라인 참조.

## 근본 원인(다중 결함의 결합)

1. 미들웨어 단독 인증 + CVE-2025-29927(위조 헤더로 우회) -> 미인증 접근 성립
2. 입력 미검증(command injection) -> RCE 성립
3. sudo `find` NOPASSWD 오구성 -> nextjs→root 상승 성립
4. IMDS 자격증명 노출(온박스 RCE 앞에서는 IMDSv2도 우회) -> 자격증명 탈취 성립
5. IAM 과대권한(`s3:*` on `*`) -> 유출 범위 확대

어느 한 결함만 막혔어도 데이터 유출까지 이어지지 않았음을 근본원인 분석에서 전개한다.

## 실제 사례 연결(위협 인텔)

- Capital One(2019): SSRF -> IMDS -> S3 대량 유출. 본 분석 환경과 동일한 IMDS 자격증명 탈취 패턴.
- TeamTNT: 침해한 리눅스 호스트에서 클라우드 자격증명 하베스팅.
