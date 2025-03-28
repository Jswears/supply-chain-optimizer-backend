#!/bin/bash

# Variables
S3_BUCKET=chainopt-cf-artifacts
S3_PREFIX=lambdas
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

# Functions
deploy_iam_roles() {
    print_header "Deploying IAM roles"
    aws cloudformation deploy \
        --template-file infrastructure/templates/iam.yaml \
        --stack-name chainopt-iam-roles-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides Environment=$ENVIRONMENT
}

deploy_infra() {
    print_header "Deploying infrastructure"
    aws cloudformation deploy \
        --template-file infrastructure/templates/infra.yaml \
        --stack-name chainopt-infra-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM
}

deploy_database() {
    print_header "Deploying DynamoDB tables"
    aws cloudformation deploy \
        --template-file infrastructure/templates/dynamodb.yaml \
        --stack-name chainopt-database-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides Environment=$ENVIRONMENT TableName=ChainOptInventory
}

deploy_secret_manager() {
    print_header "Deploying Secrets Manager"
    aws cloudformation deploy \
        --template-file infrastructure/templates/secrets.yaml \
        --stack-name chainopt-secret-manager-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides Environment=$ENVIRONMENT
}

deploy_rds() {
    print_header "Deploying RDS database"
    aws cloudformation deploy \
        --template-file infrastructure/templates/rds.yaml \
        --stack-name chainopt-rds-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
        Environment=$ENVIRONMENT \
        SecretArn=$(aws cloudformation list-exports --query "Exports[?Name=='ChainOptRDSCredentials-$ENVIRONMENT'].Value" --output text)
}

# New function to build and zip Lambda functions
build_lambdas() {
    print_header "Building and zipping Lambda functions"

    # Navigate to project root if needed
    if [[ ! -f "package.json" && -f "../package.json" ]]; then
        cd ..
    fi

    # Check if we're in the correct directory
    if [[ ! -f "package.json" ]]; then
        echo "Error: Could not find package.json. Please run this script from the project root or scripts directory."
        exit 1
    fi

    echo "Running esbuild to create Lambda bundles..."
    npx tsx esbuild.config.ts

    if [ $? -ne 0 ]; then
        echo "Error: Failed to build Lambda functions. Please check the logs above."
        exit 1
    fi

    echo "Lambda functions successfully built and zipped."
}

upload_lambdas_to_s3() {
    print_header "Uploading Lambda functions to S3"

    # Create bucket if it doesn't exist
    if ! aws s3 ls "s3://$S3_BUCKET" 2>&1 > /dev/null; then
        echo "Creating S3 bucket: $S3_BUCKET"
        aws s3 mb "s3://$S3_BUCKET" --region $REGION
    fi

    # Check if build directory exists and has zip files
    if [ ! -d "infrastructure/build" ] || [ -z "$(ls -A infrastructure/build/*.zip 2>/dev/null)" ]; then
        echo "No Lambda zip files found in infrastructure/build directory."
        echo "Running build process first..."
        build_lambdas
    fi

    # List files to confirm they exist
    echo "Files in build directory:"
    ls -la infrastructure/build/

    # Upload Lambda functions with explicit content type
    for file in infrastructure/build/*.zip; do
        filename=$(basename "$file")
        s3_key="$S3_PREFIX/$filename"
        echo "Uploading $filename to s3://$S3_BUCKET/$s3_key"
        aws s3 cp "$file" "s3://$S3_BUCKET/$s3_key" --content-type "application/zip"

        # Verify upload was successful
        if aws s3 ls "s3://$S3_BUCKET/$s3_key" &>/dev/null; then
            echo "✅ Verified: $filename uploaded successfully"
        else
            echo "❌ Error: Failed to upload $filename to S3"
            exit 1
        fi
    done

    # List objects in the S3 bucket to verify
    echo "Files in S3 bucket $S3_BUCKET/$S3_PREFIX/:"
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/"
}

deploy_inventory_lambda() {
    print_header "Deploying inventory Lambda functions"

    # First verify that the Lambda code exists in S3
    for lambda_file in addProduct.zip getAllProducts.zip getProduct.zip deleteProduct.zip updateProduct.zip getAllProductsByWarehouseId.zip transferProduct.zip; do
        s3_key="$S3_PREFIX/$lambda_file"
        if ! aws s3 ls "s3://$S3_BUCKET/$s3_key" &>/dev/null; then
            echo "❌ Error: Lambda code $lambda_file not found in S3 bucket"
            echo "Please make sure the Lambda code is built and uploaded correctly."
            return 1
        fi
    done

    aws cloudformation deploy \
        --template-file infrastructure/templates/inventory-stack.yaml \
        --stack-name chainopt-inventory-stack-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
        Environment=$ENVIRONMENT \
        LambdaCodeBucket=$S3_BUCKET \
        LambdaCodePrefix=$S3_PREFIX
}

deploy_orders_lambda() {
    print_header "Deploying orders Lambda functions"
    aws cloudformation deploy \
        --template-file infrastructure/templates/orders-stack.yaml \
        --stack-name chainopt-orders-stack-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
        Environment=$ENVIRONMENT \
        LambdaCodeBucket=$S3_BUCKET \
        LambdaCodePrefix=$S3_PREFIX
}

deploy_api() {
    print_header "Deploying unified API Gateway"
    aws cloudformation deploy \
        --template-file infrastructure/templates/api.yaml \
        --stack-name chainopt-api-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides Environment=$ENVIRONMENT
}

deploy_all() {
    print_header "STARTING DEPLOYMENT OF ALL RESOURCES"
    deploy_iam_roles
    deploy_infra
    deploy_database
    deploy_secret_manager
    deploy_rds

    # Build and verify before uploading
    build_lambdas
    upload_lambdas_to_s3

    deploy_inventory_lambda
    if [ $? -ne 0 ]; then
        echo "Failed to deploy inventory Lambda functions. Check the logs above."
        exit 1
    fi

    deploy_orders_lambda
    deploy_api
    print_header "DEPLOYMENT COMPLETE!"

    # Display API URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name chainopt-api-$ENVIRONMENT-$REGION \
        --query "Stacks[0].Outputs[?OutputKey=='ChainOptApiUrl'].OutputValue" \
        --output text)

    echo "ChainOpt API is available at: $API_URL"
}

# Display menu if no arguments provided
if [ $# -eq 0 ]; then
    echo "ChainOpt Deployment Tool"
    echo "-----------------------"
    echo "Choose an option:"
    echo "1) Deploy everything"
    echo "2) Deploy IAM roles"
    echo "3) Deploy infrastructure"
    echo "4) Deploy database"
    echo "5) Deploy Secrets Manager"
    echo "6) Deploy RDS"
    echo "7) Build Lambda functions"
    echo "8) Upload Lambdas to S3"
    echo "9) Deploy inventory Lambda"
    echo "10) Deploy orders Lambda"
    echo "11) Deploy API Gateway"
    echo "q) Quit"

    read -p "Enter choice [1-11 or q]: " choice

    case $choice in
        1) deploy_all ;;
        2) deploy_iam_roles ;;
        3) deploy_infra ;;
        4) deploy_database ;;
        5) deploy_secret_manager ;;
        6) deploy_rds ;;
        7) build_lambdas ;;
        8) upload_lambdas_to_s3 ;;
        9) deploy_inventory_lambda ;;
        10) deploy_orders_lambda ;;
        11) deploy_api ;;
        q|Q) echo "Exiting"; exit 0 ;;
        *) echo "Invalid choice"; exit 1 ;;
    esac
else
    # Process command line arguments
    case "$1" in
        all) deploy_all ;;
        iam) deploy_iam_roles ;;
        infra) deploy_infra ;;
        db) deploy_database ;;
        secrets) deploy_secret_manager ;;
        rds) deploy_rds ;;
        build) build_lambdas ;;
        upload) upload_lambdas_to_s3 ;;
        inventory) deploy_inventory_lambda ;;
        orders) deploy_orders_lambda ;;
        api) deploy_api ;;
        *) echo "Unknown argument: $1"; exit 1 ;;
    esac
fi
