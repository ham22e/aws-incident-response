data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${var.prefix}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json

  tags = { Name = "${var.prefix}-ec2-role" }
}

# 의도적 취약: 과대권한. 인스턴스 역할에 전체 S3 접근(s3:*, 모든 리소스)을 부여한다.
# 최소권한 원칙 위반이며, 자격증명 탈취 시 유출 범위를 키우는 근본 원인 중 하나.
# (부수적으로 배포 버킷 pull에도 이 권한이 쓰이지만, 최소권한이라면 배포는
#  읽기 전용으로 별도 스코핑했어야 한다.)
data "aws_iam_policy_document" "ec2_over_perm" {
  statement {
    sid       = "OverPermissiveS3"
    actions   = ["s3:*"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "ec2_over_perm" {
  name   = "${var.prefix}-over-permissive-s3"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_over_perm.json
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# EC2 호스트 로그 수집용 SSM Session Manager. 인바운드 포트 개방 없이 아웃바운드로만 동작.
# AL2023는 SSM 에이전트가 기본 설치/실행되므로 이 정책만 붙이면 세션/명령 실행이 가능해진다.
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
