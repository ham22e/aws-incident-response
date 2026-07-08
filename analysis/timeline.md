# 침해 타임라인

> 사고 ID: `CLOUDIR-2026-0709` · 2026-07-09 (KST)
> 모든 시각은 KST (UTC+9). 원본 로그·`normalized.csv`·`hunt.py` 기본 출력은 UTC(KST-9).
> 공격자 IP는 운영자 공인 IP라 마스킹함(`203.0.113.42`).
> 원본 근거는 gitignore된 `analysis/raw/`, `analysis/normalized.csv`.

## 개요

2026-07-09 15:24~15:32 KST, Cloud Ops 사내 운영 콘솔의 네트워크 진단 관리 도구에 대해 CVE-2025-29927
미들웨어 인증 우회와 command injection이 연쇄되어 EC2에서 원격 코드 실행이 발생했다. RCE는 비권한 `nextjs`
계정으로 떨어졌고 sudo 오구성(`find` GTFOBins)으로 root까지 상승했다. 이어 IMDSv2에서 인스턴스
역할 임시 자격증명이 탈취되어 S3 민감 버킷의 데이터 2건이 유출되었다. 최초 침투(15:24:46)부터
유출(15:32:02)까지 체류 시간은 약 7분 16초다(각 단계는 `attack/scripts/*`로 실행).

## 상세 타임라인

| 시각(KST) | 단계 | 행위 | 근거 | ATT&CK |
|-----------|------|------|------|--------|
| 15:24:46 | 초기 침투 | 위조 `x-middleware-subrequest`로 인증 우회 후 `POST /api/internal/diagnostics` `host=...;id`,`;uname -a` 로 RCE(비권한 nextjs) | host 웹 로그 | T1190, T1059.004 |
| 15:26:34 | 권한 상승 | `sudo -n /usr/bin/find ... -exec`(GTFOBins)로 nextjs→root, 이어 `/etc/shadow` 덤프 | host 웹 로그(주입 요청) | T1548.003, T1003.008 |
| 15:29:06 | 자격증명 접근 | IMDSv2 토큰 발급 후 `.../iam/security-credentials/cloudir-ec2-role` 조회로 임시키 탈취 | host 웹 로그 | T1552.005 |
| 15:32:00 | 정찰 | 탈취 역할로 `aws s3 ls`(ListObjects), 외부 IP·aws-cli | CloudTrail | T1078.004, T1580, T1619 |
| 15:32:02 | 수집/유출 | `aws s3 cp` 로 `config/api_keys.txt`, `exports/customers.csv` 유출(GetObject 2건) | CloudTrail 데이터 이벤트 | T1530 |

## 서술

1. 15:24:46 - 공격자(`203.0.113.42`)가 내부 전용 헤더 `x-middleware-subrequest`를 위조해
   미들웨어 인증(CVE-2025-29927)을 우회하고, 보호 API `POST /api/internal/diagnostics` 의 `host`
   파라미터에 `;id`, `;uname -a` 를 주입해 원격 코드 실행을 확인했다. 앱이 비권한 `nextjs`
   계정으로 구동되므로 이 시점 RCE 권한은 nextjs(uid≠0)였다. 위조 헤더값은 access log의 `mws`
   필드에 그대로 남아 우회 시도가 탐지 가능하다.
2. 15:26:34 - RCE로 실행한 `sudo -n /usr/bin/find ... -exec` 를 통해 root 권한을 획득했다.
   운영 편의로 심긴 sudoers 오구성(`nextjs ALL=NOPASSWD: /usr/bin/find`)이 GTFOBins privesc
   경로가 됐다. 이어 root 권한으로 `/etc/shadow` 를 덤프해 로컬 계정 password hash를 확보했다
   (T1003.008). 다만 다음 단계(IMDS 조회)는 root가 필수는 아니며, 이 단계는 호스트 완전 장악과
   로컬 자격증명 탈취라는 독립 축이다.
3. 15:29:06 - RCE를 통해 인스턴스 메타데이터 서비스(169.254.169.254)에서 역할 `cloudir-ec2-role`
   의 임시 자격증명을 조회했다. IMDSv2라 먼저 PUT으로 세션 토큰을 받고 GET에 토큰 헤더를 실었으나,
   인스턴스 내부(온박스) 조회라 그대로 도달했다. IMDS 접근 자체는 CloudTrail에 남지 않으므로,
   탈취 시점은 host 웹 로그의 IMDS 호출 흔적과 이후 첫 API 사용(15:32:00) 사이로 특정된다.
4. 15:32:00~15:32:02 - 탈취한 임시키(`ASIA...`)를 공격자 로컬(외부 워크스테이션 aws-cli)에서 사용해
   버킷을 열거하고(`s3 ls`) 민감 객체 2건을 다운로드했다(`s3 cp`, GetObject 2건). sourceIPAddress가
   인스턴스가 아닌 외부 공인 IP인 점이 "인스턴스 자격증명의 오프-인스턴스 사용"이라는 강한 침해 신호다.

> 분석 노트: 수집 과정에서 동일 역할의 `ssm:SendCommand` 가 외부 IP에서 CloudTrail에 찍히는 경우가
> 있는데, 이는 공격이 아니라 분석자가 탈취 자격증명이 셸에 남은 상태로 수집을 시도한 흔적이다(본
> 검증에서도 재현됨). 탐지 이벤트가 반드시 악성은 아니며 맥락(누가/왜)이 필요함을 보여준다. 분석은
> 자격증명을 분석자 식별자로 교체(`unset` 후 본인 프로파일)한 뒤 재수행한다.
>
> 위 시각은 검증 실행(`analysis/normalized.csv`, UTC 원본)에서 나온 실제 타임스탬프를 KST(+9h)로 표기한 것이다.
