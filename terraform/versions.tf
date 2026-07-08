terraform {
  required_version = ">= 1.14"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # 확인된 최신 stable: v6.53.0 (2026-07 기준). major 6에 고정.
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }
}
