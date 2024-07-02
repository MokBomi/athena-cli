output "service_url" {
  value = aws_lb.main.dns_name
}