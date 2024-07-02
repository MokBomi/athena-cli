terraform {
  backend "s3" {
    bucket = "my-terraform-state-bucket-rsduran-20240702" # Replace with your unique bucket name
    key    = "terraform/state"
    region = "ap-southeast-2"
  }
}

provider "aws" {
  region = "ap-southeast-2"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "main_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-southeast-2a"
}

resource "aws_subnet" "main_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-southeast-2b"
}

resource "aws_security_group" "main" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_cluster" "main" {
  name = "athena-cluster"
}

resource "aws_ecr_repository" "athena" {
  name = "athena"
}

data "aws_iam_role" "existing_ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"
}

resource "aws_iam_role" "ecs_task_execution_role" {
  count = length(data.aws_iam_role.existing_ecs_task_execution_role.name) == 0 ? 1 : 0

  name = "ecsTaskExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  ]
}

resource "aws_ecs_task_definition" "main" {
  family                   = "athena-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "athena"
      image     = "${aws_ecr_repository.athena.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
    }
  ])

  execution_role_arn = length(data.aws_iam_role.existing_ecs_task_execution_role.name) == 0 ? aws_iam_role.ecs_task_execution_role[0].arn : data.aws_iam_role.existing_ecs_task_execution_role.arn
}

resource "aws_lb" "main" {
  name               = "athena-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.main.id]
  subnets            = [aws_subnet.main_a.id, aws_subnet.main_b.id]

  depends_on = [aws_internet_gateway.main]
}

resource "aws_lb_target_group" "main" {
  name       = "athena-tg"
  port       = 8000
  protocol   = "HTTP"
  target_type = "ip"
  vpc_id     = aws_vpc.main.id
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  depends_on = [aws_lb_target_group.main]
}

resource "aws_ecs_service" "main" {
  name            = "athena-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = 1

  network_configuration {
    subnets         = [aws_subnet.main_a.id, aws_subnet.main_b.id]
    security_groups = [aws_security_group.main.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "athena"
    container_port   = 8000
  }

  depends_on = [aws_lb.main, aws_lb_listener.main]
}

data "aws_ami" "ecs_optimized" {
  most_recent = true
  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }

  owners = ["amazon"]
}

resource "aws_instance" "ecs_instance" {
  ami           = data.aws_ami.ecs_optimized.id
  instance_type = "t2.micro"
  count         = 1

  network_interface {
    device_index           = 0
    subnet_id              = aws_subnet.main_a.id
    security_groups        = [aws_security_group.main.id]
    associate_public_ip_address = true
  }

  user_data = <<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
              EOF

  tags = {
    Name = "ecs-instance"
  }
}