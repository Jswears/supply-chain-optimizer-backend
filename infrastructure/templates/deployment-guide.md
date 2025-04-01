# ChainOpt Deployment Guide

This comprehensive guide outlines the steps to deploy, maintain, and troubleshoot the ChainOpt Supply Chain Optimization platform on AWS.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Deployment Process](#deployment-process)
- [Post-Deployment Validation](#post-deployment-validation)
- [Maintenance and Updates](#maintenance-and-updates)
- [Troubleshooting](#troubleshooting)
- [Cleanup Resources](#cleanup-resources)
- [API Reference](#api-reference)

## Architecture Overview

ChainOpt uses a serverless microservices architecture on AWS with the following components:

- **API Gateway** - RESTful API endpoints for all services
- **Lambda Functions** - Serverless compute for business logic
- **DynamoDB** - NoSQL storage for inventory data
- **RDS (PostgreSQL)** - Relational storage for orders data
- **S3** - Object storage for lambda code, forecast data
- **Secrets Manager** - Secure storage for database credentials
- **CloudWatch** - Monitoring and logging
- **IAM** - Security and permissions

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with administrator access
2. **AWS CLI** installed and configured
3. **Node.js** v22+ and npm
4. **Git** for version control
5. **S3 Bucket** for CloudFormation templates and Lambda code
6. **IAM permissions** to create all required resources
7. **OpenAI API Key** for forecast summary generation

## Deployment Process

You can deploy the entire stack using our deployment script or follow the manual steps below.

### Option 1: Using the Deployment Script (Recommended)

```bash
# Set your environment variables
export ENVIRONMENT=dev  # Can be dev, staging, or prod
export REGION=eu-central-1
export S3_BUCKET=chainopt-cf-artifacts

# Clone the repository
git clone https://github.com/Jswears/supply-chain-optimizer-backend.git
cd supply-chain-optimizer-backend/

# Install dependencies
npm install

# Build the project (this is handled by the deployment script, but in case of issues)
npx tsx esbuild.config.ts

# Run the deployment script
cd infrastructure/scripts
./deploy-script.sh
```

The script provides an interactive menu. Select "1" to deploy everything or select specific components to deploy.

The deployment script handles all the steps automatically including:
- Building and zipping Lambda functions
- Creating/updating IAM roles and policies
- Creating DynamoDB tables
- Configuring Secrets Manager
- Provisioning RDS database
- Uploading Lambda functions to S3
- Deploying Lambda function stacks
- Setting up the unified API Gateway

### Option 2: Manual Deployment Steps

If you prefer to deploy each component separately for more control, follow these steps:

1. **Deploy Infrastructure Stack**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/templates/infra.yaml \
     --stack-name chainopt-infra-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Deploy IAM Roles**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/templates/iam.yaml \
     --stack-name chainopt-iam-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides Environment=${ENVIRONMENT}
   ```

3. **Deploy DynamoDB Tables**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/templates/dynamodb.yaml \
     --stack-name chainopt-dynamodb-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides Environment=${ENVIRONMENT} TableName=ChainOptInventory
   ```

4. **Deploy Secrets Manager**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/templates/secrets.yaml \
     --stack-name chainopt-secrets-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides Environment=${ENVIRONMENT}
   ```

5. **Deploy RDS Database**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/templates/rds.yaml \
     --stack-name chainopt-rds-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides \
       Environment=${ENVIRONMENT} \
       SecretArn=$(aws cloudformation list-exports --query "Exports[?Name=='ChainOptRDSCredentials-${ENVIRONMENT}'].Value" --output text)
   ```

6. **Build and Upload Lambda Functions**
   ```bash
   # Build Lambda functions using esbuild
   npx tsx esbuild.config.ts

   # Create S3 bucket if it doesn't exist
   aws s3 mb s3://chainopt-lambda-${ENVIRONMENT} --region ${REGION}

   # Upload to S3
   aws s3 cp infrastructure/build/ s3://chainopt-lambda-${ENVIRONMENT}/lambdas/ --recursive
   ```

7. **Deploy Lambda Function Stacks**
   ```bash
   # Deploy Inventory Lambda Stack
   aws cloudformation deploy \
     --template-file infrastructure/templates/inventory-stack.yaml \
     --stack-name chainopt-inventory-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides \
       Environment=${ENVIRONMENT} \
       LambdaCodeBucket=chainopt-lambda-${ENVIRONMENT} \
       LambdaCodePrefix=lambdas/ \
       InventoryTableName=ChainOptInventory-${ENVIRONMENT}

   # Deploy Orders Lambda Stack
   aws cloudformation deploy \
     --template-file infrastructure/templates/orders-stack.yaml \
     --stack-name chainopt-orders-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides \
       Environment=${ENVIRONMENT} \
       LambdaCodeBucket=chainopt-lambda-${ENVIRONMENT} \
       LambdaCodePrefix=lambdas/ \
       RDSSecretId=ChainOptRDSCredentials-${ENVIRONMENT}

   # Deploy Forecast Lambda Stack
   aws cloudformation deploy \
     --template-file infrastructure/templates/forecast-stack.yaml \
     --stack-name chainopt-forecast-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides \
       Environment=${ENVIRONMENT} \
       LambdaCodeBucket=chainopt-lambda-${ENVIRONMENT} \
       LambdaCodePrefix=lambdas/ \
       OpenAIApiKeySecretId=ChainOptOpenAIKey-${ENVIRONMENT} \
       ForecastBucketName=chainopt-ml-models-${ENVIRONMENT}
   ```

8. **Deploy Unified API Gateway**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/templates/api.yaml \
     --stack-name chainopt-api-${ENVIRONMENT} \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides Environment=${ENVIRONMENT}
   ```

9. **Get API Endpoint URL**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name chainopt-api-${ENVIRONMENT} \
     --query "Stacks[0].Outputs[?OutputKey=='ChainOptApiUrl'].OutputValue" \
     --output text
   ```

## Post-Deployment Validation

After deployment, verify that the system is functioning correctly:

1. **Check API Gateway** - Ensure all endpoints are properly mapped
   ```bash
   aws apigateway get-stage \
     --rest-api-id $(aws cloudformation describe-stacks --stack-name chainopt-api-${ENVIRONMENT} --query "Stacks[0].Outputs[?OutputKey=='RestApiId'].OutputValue" --output text) \
     --stage-name ${ENVIRONMENT}
   ```

2. **Test API Endpoints** - Use curl or Postman to test key endpoints:
   ```bash
   # Get the API URL
   API_URL=$(aws cloudformation describe-stacks \
     --stack-name chainopt-api-${ENVIRONMENT} \
     --query "Stacks[0].Outputs[?OutputKey=='ChainOptApiUrl'].OutputValue" \
     --output text)

   # Test the products endpoint
   curl -X GET $API_URL/products
   ```

3. **Check Lambda Logs** - Review CloudWatch logs for any errors
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/chainopt-inventory-get-all-products-${Environment} \
     --filter-pattern "ERROR" \
     --start-time $(date -d '1 hour ago' +%s000)
   ```

4. **Verify Database Connectivity** - Check if database initialization Lambda executed successfully:
   ```bash
   aws logs get-log-events \
     --log-group-name /aws/lambda/chainopt-orders-initialize-db-${Environment}} \
     --limit 10
   ```

5. **Test Forecast Data** - Verify that forecast data is accessible:
   ```bash
   curl -X GET "$API_URL/forecast/PROD-12345678"
   ```

## Maintenance and Updates

### Updating Lambda Functions

1. Make code changes
2. Build with esbuild
   ```bash
   npx tsx esbuild.config.ts
   ```
3. Upload to S3 and update the Lambda function
   ```bash
   aws s3 cp infrastructure/build/updatedFunction.zip s3://$S3_BUCKET/lambdas/
   aws lambda update-function-code \
     --function-name chainopt-inventory-getAllProducts-${ENVIRONMENT} \
     --s3-bucket $S3_BUCKET \
     --s3-key lambdas/getAllProducts.zip
   ```

### Database Maintenance

1. **RDS Backups** - Backups are automatically managed by AWS RDS
2. **DynamoDB** - Consider enabling point-in-time recovery for important tables

### Environment Variables and Secrets

1. To update environment variables for a Lambda function:
   ```bash
   aws lambda update-function-configuration \
     --function-name chainopt-inventory-getAllProducts-${ENVIRONMENT} \
     --environment "Variables={INVENTORY_TABLE_NAME=new-table-name,NODE_ENV=prod}"
   ```

2. To update AWS Secrets Manager secrets:
   ```bash
   aws secretsmanager update-secret \
     --secret-id ChainOptRDSCredentials-${ENVIRONMENT} \
     --secret-string "{\"username\":\"dbadmin\",\"password\":\"newpassword\",\"host\":\"new-host\",\"port\":\"5432\",\"dbname\":\"chainopt_orders\"}"
   ```

### Scaling Considerations

- **DynamoDB**: Monitor provisioned capacity and consider auto-scaling
- **Lambda**: Adjust memory/timeout for functions with high execution time
- **API Gateway**: Set appropriate throttling limits
- **RDS**: Consider upgrading instance size based on order volume

## Troubleshooting

### Common Issues

1. **API Gateway 5xx Errors**
   - Check Lambda execution permissions
   - Verify Lambda function timeout settings
   - Review CloudWatch logs for errors
   - Ensure CORS is properly configured

2. **DynamoDB Errors**
   - Verify IAM permissions for Lambda roles
   - Check capacity provisioning
   - Validate key schema in table access

3. **RDS Connection Issues**
   - Verify VPC and security group configurations
   - Check that Lambda functions have the correct network access
   - Validate database credentials in Secrets Manager

4. **Forecast Data Not Available**
   - Check S3 bucket permissions
   - Verify CSV file format and structure
   - Ensure Lambda has permissions to access S3

5. **OpenAI API Errors**
   - Verify the API key is correctly stored and accessible
   - Check for rate limiting or quota issues
   - Review error messages in CloudWatch logs

### Lambda Logs

To check Lambda logs:

```bash
aws logs get-log-events \
  --log-group-name /aws/lambda/chainopt-inventory-getAllProducts-${ENVIRONMENT} \
  --log-stream-name $(aws logs describe-log-streams \
    --log-group-name /aws/lambda/chainopt-inventory-getAllProducts-${ENVIRONMENT} \
    --order-by LastEventTime \
    --descending \
    --limit 1 \
    --query 'logStreams[0].logStreamName' \
    --output text)
```

## Cleanup Resources

When you want to remove the deployed resources, use the included delete script.

### Using the Delete Script

```bash
# Navigate to the scripts directory
cd infrastructure/scripts

# Delete all resources
./delete-script.sh

# Or specify environment, region, and bucket
./delete-script.sh -e prod -r us-east-1 -b my-custom-bucket

# Delete specific components
./delete-script.sh api       # Delete only API Gateway
./delete-script.sh lambda    # Delete only Lambda functions
./delete-script.sh db        # Delete only DynamoDB
```

The script will delete resources in the correct order to avoid dependency conflicts.
It also includes safeguards to confirm deletion before proceeding.

### Manual Resource Deletion

If you prefer to delete resources manually, follow this order to avoid dependency issues:

1. API Gateway
2. Lambda functions
3. RDS database
4. Secrets Manager
5. DynamoDB tables
6. IAM roles
7. Infrastructure (VPC, subnets, etc.)
8. S3 bucket

## API Reference

For a comprehensive list of all API endpoints, request and response formats, please refer to our [API Documentation](../docs/API.md).

### Quick Reference for Common Endpoints

#### Inventory Endpoints

```bash
# Get all products
curl -X GET $API_URL/products

# Create a new product
curl -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Chocolate Chip Cookies",
    "warehouse_id": "WH-001",
    "stock_level": 100,
    "reorder_threshold": 20,
    "supplier": "Sweet Treats Inc.",
    "category": "Baked Goods"
  }'

# Get a specific product
curl -X GET "$API_URL/products/PROD-12345678?warehouseId=WH-001"

# Update a product
curl -X PUT "$API_URL/products/PROD-12345678?warehouseId=WH-001" \
  -H "Content-Type: application/json" \
  -d '{
    "stock_level": 150,
    "reorder_threshold": 30
  }'

# Delete a product
curl -X DELETE "$API_URL/products/PROD-12345678?warehouseId=WH-001"

# Get all products in a warehouse
curl -X GET $API_URL/warehouses/WH-001/products

# Transfer stock between warehouses
curl -X POST $API_URL/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PROD-12345678",
    "from_warehouse": "WH-001",
    "to_warehouse": "WH-002",
    "quantity": 50
  }'
```

#### Order Endpoints

```bash
# Get all orders
curl -X GET $API_URL/orders

# Get orders by status
curl -X GET "$API_URL/orders?status=Pending"

# Create a new order
curl -X POST $API_URL/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PROD-12345678",
    "warehouse_id": "WH-001",
    "quantity": 25,
    "status": "Pending"
  }'
```

#### Forecast Endpoints

```bash
# Get forecast data for a product
curl -X GET $API_URL/forecast/PROD-12345678

# Get AI-generated forecast summary
curl -X POST $API_URL/forecast/PROD-12345678/summary \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Chocolate Chip Cookies"
  }'
```
