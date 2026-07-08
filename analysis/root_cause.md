# 근본 원인 분석

## 결론

단일 취약점이 아니라 다섯 가지 결함이 연쇄되어 데이터 유출로 이어졌다. 어느 한 단계라도
차단됐다면 유출까지 도달하지 못했다.

## 결함의 연쇄

```
미들웨어 단독 인증 + CVE-2025-29927(위조 x-middleware-subrequest)  ->  미인증 접근
    |
command injection(입력 미검증)  ->  RCE (비권한 nextjs)
    |
sudo find NOPASSWD 오구성  ->  nextjs → root 권한 상승
    |
IMDS 자격증명 노출(온박스 RCE 앞에서는 IMDSv2도 우회)  ->  인스턴스 역할 임시키 탈취
    |
IAM 과대권한(s3:* on *)  ->  전체 S3 접근 -> 대량 유출
```

## 각 결함과 차단 가능성(방어 관점)

| # | 결함 | 결과 | 가장 효과적인 대응 |
|---|------|------|--------------------|
| 1 | 인증을 미들웨어에만 의존 + Next.js 15.1.6의 CVE-2025-29927 | 위조 헤더로 미들웨어 우회 -> 미인증 접근 | Next.js ≥ 15.2.3 패치, 라우트 핸들러 자체 인증(심층방어) |
| 2 | 진단 API가 `host` 입력을 셸에 그대로 전달(command injection) | 원격 코드 실행(RCE) | `execFile`+인자 배열(셸 미사용), host 형식 검증 |
| 3 | `nextjs ALL=NOPASSWD: /usr/bin/find` sudo 오구성 | GTFOBins로 nextjs→root 상승 | sudo NOPASSWD 제거, 필요 시 명령/인자 고정 또는 SSM 문서 |
| 4 | 인스턴스 역할에 `s3:*` on `*` | 유출 범위가 계정 전체 S3로 확대 | 최소권한(필요한 버킷/액션만), 조건 제한 |
| 5 | RCE로 IMDS 자격증명 도달 | 인스턴스 역할 임시키 탈취 | (근본은 1·2번) IMDSv2+hop limit 유지, 역할 권한 최소화 |

## 핵심 뉘앙스: IMDSv2가 만능은 아니다

이번 사고는 SSRF가 아니라 RCE로 자격증명을 탈취했다. IMDSv2는 SSRF(공격자가 헤더를 세팅할 수
없는 경우)를 크게 완화하지만, 완전한 RCE 앞에서는 공격자가 IMDSv2 토큰도 직접 PUT으로 받아올 수
있어 방어력이 제한적이다. 따라서 이 시나리오에서 유출 규모를 실제로 좌우한 것은 **IAM 최소권한**
이다. (참고: Capital One 2019는 SSRF였으므로 IMDSv2가 유효한 대응이었다. 공격 벡터에 따라
효과적인 통제가 다르다는 점이 중요하다.)

## 대응 우선순위

1. CVE-2025-29927 패치(Next.js ≥ 15.2.3) + 라우트 자체 인증(미인증 접근 차단)
2. command injection 제거(`execFile`+검증. RCE 자체 차단)
3. IAM 최소권한(유출 blast radius 축소. 이번 사고의 규모 결정 요인)
4. sudo `find` NOPASSWD 오구성 제거(nextjs→root privesc 차단)
5. IMDSv2 강제 + hop limit, 웹 서비스 저권한(`nextjs`) 실행 — 이미 적용됨, 현 상태 유지
6. 탐지: 인스턴스 역할 자격증명의 오프-인스턴스 사용 경보(다음 `detection/` 참고)
