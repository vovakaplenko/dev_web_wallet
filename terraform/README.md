# Notes

Terraform state is checked into the repo
Zone is eu-east-1
Deploy script builds, pushes to ECR, deploys to application

## Deps

1.  brew install terraform
2.  brew install awscli
3.  docker

### How to deploy api

export AWS_ACCOUNT_ID=343026901112
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
cd terraform/api && ./deploy.sh poswallet poswallet-default-poswallet us-east-1 $(git rev-parse HEAD)

## Modules used

* [Elastic beanstalk module modified for ECR access on IAM policy](https://github.com/cloudposse/terraform-aws-elastic-beanstalk-environment)

* [VPC with Internet Gateway](https://github.com/cloudposse/terraform-aws-vpc)

* [Public and private subnets provisioning in existing VPC](https://github.com/cloudposse/terraform-aws-dynamic-subnets)

* [Postgres AWS Aurora cluster](https://github.com/cloudposse/terraform-aws-rds-cluster)
