# 재현 환경 안전장치: 월 소액 예산 초과 시 알림. alert_email 을 설정하면 이메일 알림이 붙는다.
resource "aws_budgets_budget" "lab" {
  name         = "${var.prefix}-monthly"
  budget_type  = "COST"
  limit_amount = "5"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  dynamic "notification" {
    for_each = var.alert_email == null ? [] : [1]
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = 80
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [var.alert_email]
    }
  }
}
