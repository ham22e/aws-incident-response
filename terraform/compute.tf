data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t3.small" # Next.js 빌드(next build) 메모리 여유를 위해 micro -> small.
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  # IMDSv2 강제(현실적 최신 기본값). 단 이 시나리오의 침해는 SSRF가 아니라 온박스 RCE라
  # IMDSv2로도 막히지 않는다: 공격자가 토큰을 먼저 발급받아 우회한다.
  # => IMDSv2는 필요하지만 불충분. 유출을 막는 결정적 통제는 IAM 최소권한이다.
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = templatefile("${path.module}/userdata/bootstrap.sh.tftpl", {
    deploy_bucket = aws_s3_bucket.deploy.id
    deploy_key    = aws_s3_object.webapp.key
    region        = var.region
    app_etag      = aws_s3_object.webapp.etag
  })

  # 부팅 시 앱 zip을 내려받으므로 객체가 먼저 업로드돼 있어야 한다.
  depends_on = [aws_s3_object.webapp]

  tags = { Name = "${var.prefix}-web" }
}
