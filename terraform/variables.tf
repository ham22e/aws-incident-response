variable "region" {
  type    = string
  default = "ap-northeast-2"
}

variable "aws_profile" {
  type        = string
  default     = null
  description = "AWS CLI 프로파일명. 기본 자격증명 체인을 쓰면 null로 둔다."
}

variable "my_ip" {
  type        = string
  description = "운영자(공격 시뮬레이션 수행자) 공인 IP CIDR. 예: 1.2.3.4/32. 웹 포트 인바운드를 이 IP로만 제한한다."
}

variable "prefix" {
  type    = string
  default = "cloudir"
}

variable "alert_email" {
  type        = string
  default     = null
  description = "비용 경보를 받을 이메일. null이면 예산은 만들되 이메일 알림은 붙이지 않는다."
}
