output "vpc_id" {
  value = aws_vpc.lab.id
}

output "subnet_id" {
  value = aws_subnet.public.id
}

output "web_sg_id" {
  value = aws_security_group.web.id
}

output "web_public_ip" {
  value = aws_instance.web.public_ip
}

output "sensitive_bucket" {
  value = aws_s3_bucket.sensitive.id
}

output "deploy_bucket" {
  value = aws_s3_bucket.deploy.id
}

output "region" {
  value = var.region
}

output "web_instance_id" {
  value = aws_instance.web.id
}

output "trail_bucket" {
  value = aws_s3_bucket.trail.id
}

output "flow_log_group" {
  value = aws_cloudwatch_log_group.flow.name
}
