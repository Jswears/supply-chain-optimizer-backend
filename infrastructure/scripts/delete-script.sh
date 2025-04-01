#!/bin/bash

# Variables
S3_BUCKET=chainopt-cf-artifacts
ENVIRONMENT=dev
REGION=eu-central-1

# Print header for each step
print_header() {
  echo ""
  echo "======================================================"
  echo "  $1"
  echo "======================================================"
  echo ""
}

# Function to confirm deletion
confirm_deletion() {
  read -p "Are you sure you want to delete the $ENVIRONMENT environment resources? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deletion aborted."
    exit 1
  fi
}

# Delete API Gateway
delete_api() {
  print_header "Deleting API Gateway"
  aws cloudformation delete-stack \
    --stack-name chainopt-api-$ENVIRONMENT-$REGION

  echo "Waiting for API Gateway stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-api-$ENVIRONMENT-$REGION
}

# Delete Lambda functions
delete_inventory_lambda() {
  print_header "Deleting Inventory Lambda Stack"
  aws cloudformation delete-stack \
    --stack-name chainopt-inventory-stack-$ENVIRONMENT-$REGION

  echo "Waiting for Inventory Lambda stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-inventory-stack-$ENVIRONMENT-$REGION
}

delete_orders_lambda() {
  print_header "Deleting Orders Lambda Stack"
  aws cloudformation delete-stack \
    --stack-name chainopt-orders-stack-$ENVIRONMENT-$REGION

  echo "Waiting for Orders Lambda stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-orders-stack-$ENVIRONMENT-$REGION
}

delete_forecast_lambda() {
  print_header "Deleting Forecast Lambda Stack"
  aws cloudformation delete-stack \
    --stack-name chainopt-forecast-stack-$ENVIRONMENT-$REGION

  echo "Waiting for Forecast Lambda stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-forecast-stack-$ENVIRONMENT-$REGION
}

# Delete Lambda artifacts from S3
delete_lambda_artifacts() {
  print_header "Deleting Lambda artifacts from S3"

  if aws s3 ls "s3://$S3_BUCKET" &>/dev/null; then
    echo "Emptying S3 bucket: $S3_BUCKET"
    aws s3 rm "s3://$S3_BUCKET" --recursive
  else
    echo "S3 bucket $S3_BUCKET does not exist or is not accessible."
  fi
}

# Delete RDS database
delete_rds() {
  print_header "Deleting RDS database"
  aws cloudformation delete-stack \
    --stack-name chainopt-rds-$ENVIRONMENT-$REGION

  echo "Waiting for RDS stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-rds-$ENVIRONMENT-$REGION
}

# Delete Secrets Manager
delete_secret_manager() {
  print_header "Deleting Secrets Manager"
  aws cloudformation delete-stack \
    --stack-name chainopt-secret-manager-$ENVIRONMENT-$REGION

  echo "Waiting for Secrets Manager stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-secret-manager-$ENVIRONMENT-$REGION
}

# Delete DynamoDB tables
delete_database() {
  print_header "Deleting DynamoDB tables"
  aws cloudformation delete-stack \
    --stack-name chainopt-database-$ENVIRONMENT-$REGION

  echo "Waiting for Database stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-database-$ENVIRONMENT-$REGION
}

# Delete IAM roles
delete_iam_roles() {
  print_header "Deleting IAM roles"
  aws cloudformation delete-stack \
    --stack-name chainopt-iam-roles-$ENVIRONMENT-$REGION

  echo "Waiting for IAM stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-iam-roles-$ENVIRONMENT-$REGION
}

# Delete infrastructure
delete_infra() {
  print_header "Deleting Infrastructure"
  aws cloudformation delete-stack \
    --stack-name chainopt-infra-$ENVIRONMENT-$REGION

  echo "Waiting for Infrastructure stack deletion to complete..."
  aws cloudformation wait stack-delete-complete \
    --stack-name chainopt-infra-$ENVIRONMENT-$REGION
}

# Delete S3 bucket
delete_s3_bucket() {
  print_header "Deleting S3 bucket"

  if aws s3 ls "s3://$S3_BUCKET" &>/dev/null; then
    echo "Deleting S3 bucket: $S3_BUCKET"
    aws s3 rb "s3://$S3_BUCKET" --force
  else
    echo "S3 bucket $S3_BUCKET does not exist or is not accessible."
  fi
}

# Delete everything in the right order
delete_all() {
  print_header "STARTING DELETION OF ALL RESOURCES"

  confirm_deletion

  delete_api
  delete_inventory_lambda
  delete_orders_lambda
  delete_forecast_lambda
  delete_lambda_artifacts
  delete_rds
  delete_secret_manager
  delete_database
  delete_iam_roles
  delete_infra
  delete_s3_bucket

  print_header "DELETION COMPLETE!"
}

# Display environment settings
show_settings() {
  echo "ChainOpt Delete Tool"
  echo "-----------------------"
  echo "Environment: $ENVIRONMENT"
  echo "Region: $REGION"
  echo "S3 Bucket: $S3_BUCKET"
  echo "-----------------------"
  echo ""
}

# Parse command line arguments for environment
while getopts ":e:r:b:" opt; do
  case $opt in
    e) ENVIRONMENT="$OPTARG"
    ;;
    r) REGION="$OPTARG"
    ;;
    b) S3_BUCKET="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    exit 1
    ;;
  esac
done

# Reset positional parameters
shift $((OPTIND-1))

# Show settings
show_settings

# Display menu if no arguments provided
if [ $# -eq 0 ]; then
  echo "Choose an option:"
  echo "1) Delete everything (recommended order)"
  echo "2) Delete API Gateway only"
  echo "3) Delete Lambda functions only"
  echo "4) Delete Lambda artifacts from S3 only"
  echo "5) Delete RDS database only"
  echo "6) Delete Secrets Manager only"
  echo "7) Delete DynamoDB tables only"
  echo "8) Delete IAM roles only"
  echo "9) Delete infrastructure only"
  echo "10) Delete S3 bucket only"
  echo "q) Quit"

  read -p "Enter choice [1-10 or q]: " choice

  case $choice in
    1) delete_all ;;
    2) delete_api ;;
    3) delete_inventory_lambda && delete_orders_lambda ;;
    4) delete_lambda_artifacts ;;
    5) delete_rds ;;
    6) delete_secret_manager ;;
    7) delete_database ;;
    8) delete_iam_roles ;;
    9) delete_infra ;;
    10) delete_s3_bucket ;;
    q|Q) echo "Exiting"; exit 0 ;;
    *) echo "Invalid choice"; exit 1 ;;
  esac
else
  # Process command line arguments
  case "$1" in
    all) delete_all ;;
    api) delete_api ;;
    lambda) delete_inventory_lambda && delete_orders_lambda ;;
    artifacts) delete_lambda_artifacts ;;
    rds) delete_rds ;;
    secrets) delete_secret_manager ;;
    db) delete_database ;;
    iam) delete_iam_roles ;;
    infra) delete_infra ;;
    s3) delete_s3_bucket ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
fi
