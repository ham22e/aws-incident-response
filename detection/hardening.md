# 하드닝 (재발 방지)

근본 원인(`analysis/root_cause.md`)의 각 결함을 코드로 제거하는 변경. 대응 우선순위 순.
어느 한 링크만 끊어도 전체 체인이 성립하지 않는다.

## 1. command injection 제거 (RCE 자체 차단)

`app/webapp/app/api/internal/diagnostics/route.ts` - 셸을 쓰는 `exec` 대신
인자 배열을 넘기는 `execFile` + host 형식 검증.

```diff
-import { exec } from 'node:child_process';
+import { execFile } from 'node:child_process';
 import { promisify } from 'node:util';
-const execAsync = promisify(exec);
+const execFileAsync = promisify(execFile);
 ...
-    const { stdout, stderr } = await execAsync(`ping -c 1 ${host}`, {
-      timeout: 10_000,
-    });
+    // host를 IP/호스트명 문자셋으로 제한(셸 메타문자 차단) 후 인자 배열로 전달.
+    if (!/^[A-Za-z0-9.:-]+$/.test(host)) {
+      return NextResponse.json({ error: 'invalid host' }, { status: 400 });
+    }
+    const { stdout, stderr } = await execFileAsync('ping', ['-c', '1', host], {
+      timeout: 10_000,
+    });
```

## 2. CVE-2025-29927 미들웨어 우회 차단 + 인증 심층방어

미들웨어 단독 인증에 의존하면 프레임워크 버그(위조 `x-middleware-subrequest`) 하나로
모든 인가가 무력화된다. Next.js를 패치 버전으로 올리고, 보호 라우트 핸들러 자체에서도
인증을 확인한다(미들웨어는 심층방어의 한 겹일 뿐).

```diff
 // app/webapp/package.json
-    "next": "15.1.6",
+    "next": "^15.2.3",   // CVE-2025-29927 패치 포함
```

```diff
 // app/webapp/app/api/internal/diagnostics/route.ts (핸들러 진입부)
+  // 미들웨어에만 의존하지 않고 라우트에서도 세션을 재확인한다.
+  const session = req.headers.get('cookie')?.includes('session=');
+  if (!session) {
+    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
+  }
```

## 3. IAM 최소권한 (유출 blast radius 축소)

`terraform/iam.tf` - `s3:*` on `*` 를 필요한 버킷/액션으로 제한.
RCE·자격증명 탈취가 성립하더라도 이 통제가 실제 유출 범위를 좌우한다.

```diff
 data "aws_iam_policy_document" "ec2_over_perm" {
   statement {
-    sid       = "OverPermissiveS3"
-    actions   = ["s3:*"]
-    resources = ["*"]
+    sid       = "LeastPrivilegeS3"
+    actions   = ["s3:GetObject"]
+    resources = ["${aws_s3_bucket.sensitive.arn}/allowed/*"]
   }
 }
```

## 4. sudo 오구성 제거 (nextjs -> root privesc 차단)

`terraform/userdata/bootstrap.sh.tftpl` - 운영 편의로 심은 `find` NOPASSWD 는
GTFOBins(`sudo find ... -exec /bin/sh`) 로 즉시 root가 되는 경로다. 제거한다.

```diff
-cat > /etc/sudoers.d/nextjs-maint <<'SUDO'
-nextjs ALL=(ALL) NOPASSWD: /usr/bin/find
-SUDO
+# (제거) nextjs 계정에 sudo NOPASSWD 를 부여하지 않는다.
+# 유지보수가 필요하면 대상 명령을 좁히고 인자를 고정하거나 SSM 문서로 대체.
```

## 5. IMDSv2 강제 (심층방어, 이미 적용됨)

`terraform/compute.tf` 는 이미 `http_tokens = "required"`(IMDSv2) + hop limit 1 로 설정돼 있다.
현 상태를 유지한다.

```hcl
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
```

참고: IMDSv2는 SSRF를 크게 완화하지만, 이번처럼 온박스 RCE가 성립하면 공격자가 인스턴스
안에서 토큰을 직접 발급해 자격증명에 도달할 수 있다. 그래서 IMDSv2만으로는 부족하고,
1번(RCE 차단)과 3번(최소권한)이 이 시나리오의 실질적 통제다.

## 6. 웹 서비스 저권한 실행 (이미 적용됨)

`bootstrap.sh.tftpl` 의 systemd 유닛은 이미 전용 저권한 계정 `nextjs`(비 root)로 구동된다.
포트 80 바인딩은 `AmbientCapabilities=CAP_NET_BIND_SERVICE` 로만 부여하고 root로 띄우지 않는다.
현 상태를 유지한다(4번과 함께 privesc 표면을 최소화).

## 7. 탐지 연결

- GuardDuty + S3 Protection 활성화(`guardduty.md`)
- `InstanceCredentialExfiltration.OutsideAWS` 파인딩을 EventBridge로 통보/자동대응
- Sigma 룰(`sigma/`)로 로그 기반 헌팅 보완(위조 `x-middleware-subrequest` + host 주입 페이로드)
