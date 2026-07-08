data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "sensitive" {
  bucket        = "${var.prefix}-sensitive-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = { Name = "${var.prefix}-sensitive" }
}

# 버킷 자체는 퍼블릭 차단(외부 개방 아님). 접근은 오직 과대권한 EC2 역할을 통해서만.
resource "aws_s3_bucket_public_access_block" "sensitive" {
  bucket                  = aws_s3_bucket.sensitive.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "customers" {
  bucket = aws_s3_bucket.sensitive.id
  key    = "exports/customers.csv"
  source = "${path.module}/data/customers.csv"
  etag   = filemd5("${path.module}/data/customers.csv")
}

resource "aws_s3_object" "api_keys" {
  bucket = aws_s3_bucket.sensitive.id
  key    = "config/api_keys.txt"
  source = "${path.module}/data/api_keys.txt"
  etag   = filemd5("${path.module}/data/api_keys.txt")
}
