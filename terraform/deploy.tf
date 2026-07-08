# ---------- 앱 배포 번들 (S3 스테이징) ----------
# EC2 user_data는 16KB 제한이 있어 멀티파일 Next.js 앱을 직접 심을 수 없다.
# 소스를 zip으로 묶어 배포 버킷에 올리고, 인스턴스가 부팅 시 내려받아 빌드한다.
data "archive_file" "webapp" {
  type        = "zip"
  source_dir  = "${path.module}/../app/webapp"
  output_path = "${path.module}/webapp.zip"

  # 로컬 빌드 산출물은 제외한다(빌드는 인스턴스에서 npm ci + next build로 수행).
  excludes = [
    "node_modules",
    ".next",
    ".git",
    "next-env.d.ts",
  ]
}

resource "aws_s3_bucket" "deploy" {
  bucket        = "${var.prefix}-deploy-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = { Name = "${var.prefix}-deploy" }
}

# 배포 버킷도 퍼블릭 차단. 접근은 EC2 인스턴스 프로파일(과대권한 s3:*)을 통해서만.
resource "aws_s3_bucket_public_access_block" "deploy" {
  bucket                  = aws_s3_bucket.deploy.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "webapp" {
  bucket = aws_s3_bucket.deploy.id
  key    = "webapp.zip"
  source = data.archive_file.webapp.output_path
  # 소스가 바뀌면 zip 해시가 바뀌어 재업로드되고, compute.tf의 user_data에도
  # 이 etag가 반영되어 인스턴스가 교체되며 새 앱을 재배포한다.
  etag = data.archive_file.webapp.output_md5
}
