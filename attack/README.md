# 공격 재현 플레이북 (하이브리드 킬체인)

> 범위/권한: 본 플레이북의 모든 행위는 이 레포의 Terraform으로 만든 본인 소유 격리 분석 환경 대상,
> 교육 및 방어(DFIR) 목적이다. 실제 타인 자산 대상 사용 금지. 검증 후 `terraform destroy`.

## 목적

의도적으로 심은 취약점을 실제로 악용해 침해사고의 "증거"를 로그로 남긴다. 이 로그가 분석 단계
(타임라인/근본원인/IOC)의 재료가 된다.

## 킬체인 개요

| 단계 | 행위 | MITRE ATT&CK | 남는 증거 |
|------|------|--------------|-----------|
| 1. 초기 침투 | CVE-2025-29927 미들웨어 우회 + `/api/internal/diagnostics` command injection으로 RCE(비권한 nextjs) | T1190, T1059.004 | 웹 access log(`mws`/`host`), 프로세스 |
| 2. 권한 상승 | sudo `find` GTFOBins로 nextjs→root | T1548.003 | 웹 access log(주입 요청), sudo/auth 로그 |
| 3. 자격증명 탈취 | IMDSv2(토큰 발급 후 조회)에서 EC2 역할 임시키 획득 | T1552.005 | (IMDS는 CloudTrail 미기록 - 분석 포인트) |
| 4. 정찰 + 유출 | 탈취 키로 신원/버킷/객체 열거 후 S3 민감 객체 다운로드 | T1078.004, T1580, T1619, T1530 | CloudTrail 관리/데이터 이벤트, Flow Logs |

## 실행 순서

```bash
export TARGET_IP=$(terraform -chdir=../terraform output -raw web_public_ip)
bash scripts/01_rce.sh       # 초기 침투(우회+RCE) 확인
bash scripts/02_privesc.sh   # nextjs -> root 권한 상승
bash scripts/03_imds.sh      # 자격증명 탈취 -> stolen/creds.env 생성(gitignore)
source stolen/creds.env       # 탈취 키를 환경변수로
bash scripts/04_exfil.sh     # 정찰 + S3 유출

# 공격 종료 후: 탈취 키 정리 (관리/수집 명령이 탈취 역할로 나가지 않도록)
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
```

`scripts/_common.sh` 는 우회 헤더·주입기(`inject()`)를 담은 공용 헬퍼로 01~03이 source 한다.

> 주의 (자격증명 위생): `source stolen/creds.env`로 불러온 탈취 키는 `AWS_ACCESS_KEY_ID` 등 환경변수로
> 셸에 남고, AWS CLI는 이 환경변수를 `AWS_PROFILE`보다 우선한다. 공격을 마친 뒤 위 `unset` 3줄로 정리하지
> 않으면 이후 `terraform`/`ssm`/`analysis/collect_all.sh` 같은 관리·수집 명령이 탈취 역할
> (`cloudir-ec2-role`, 권한 부족)로 나가 실패하고, 그 호출이 CloudTrail에 "오프박스 역할 사용"으로 찍혀
> 분석을 오염시킨다(`analysis/timeline.md`의 분석자 실수 사례). 공격용과 관리/수집용 터미널을 분리하면 안전하다.

## 기록 규칙

각 단계 실행 시각(UTC)을 메모해 둔다(스크립트가 UTC 타임스탬프를 출력한다). 분석 단계 타임라인
재구성이 쉬워진다. 실제 값(EC2 IP, 탈취 키, 버킷명)은 `stolen/`·`analysis/raw/`에만 저장하고
절대 커밋하지 않는다.

상세 단계 설명: `01_initial_access.md`, `02_privilege_escalation.md`, `03_credential_theft.md`,
`04_recon_exfil.md`. 전체 요약과 MITRE 매핑: `killchain.md`.
