#!/bin/bash

# Variables
S3_BUCKET=chainopt-cf-artifacts
S3_PREFIX=lambdas
ENVIRONMENT=dev
REGION=eu-central-1

# Functions
deploy_iam_roles() {
    aws cloudformation deploy \
        --template-file infrastructure/templates/iam.yaml \
        --stack-name chainopt-iam-roles-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM
}

deploy_infra() {
    aws cloudformation deploy \
        --template-file infrastructure/templates/infra.yaml \
        --stack-name chainopt-infra-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM
}

deploy_database() {
    aws cloudformation deploy \
        --template-file infrastructure/templates/database.yaml \
        --stack-name chainopt-database-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM
}

deploy_secret_manager() {
    aws cloudformation deploy \
        --template-file infrastructure/templates/secrets.yaml \
        --stack-name chainopt-secret-manager-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM
}

deploy_rds() {
    aws cloudformation deploy \
        --template-file infrastructure/templates/rds.yaml \
        --stack-name chainopt-rds-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
        Environment=$ENVIRONMENT \
        SecretArn=$(aws cloudformation list-exports --query "Exports[?Name=='ChainOptRDSCredentials-$ENVIRONMENT'].Value" --output text)
}

package_inventory_lambda() {
    echo "Packaging lambda functions"
    aws cloudformation package \
        --template-file infrastructure/templates/inventory-stack.yaml \
        --s3-bucket $S3_BUCKET \
        --s3-prefix $S3_PREFIX \
        --output-template-file infrastructure/templates/packaged/inventory-stack-packaged.yaml
}

package_orders_lambda() {
    echo "Packaging orders lambda functions"
    aws cloudformation package \
        --template-file infrastructure/templates/orders-stack.yaml \
        --s3-bucket $S3_BUCKET \
        --s3-prefix $S3_PREFIX \
        --output-template-file infrastructure/templates/packaged/orders-stack-packaged.yaml
}

deploy_inventory_lambda() {
    echo "Deploying inventory lambda functions"
    aws cloudformation deploy \
        --template-file infrastructure/templates/inventory-stack.yaml \
        --stack-name chainopt-inventory-stack-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
        Environment=$ENVIRONMENT \
        LambdaCodeBucket=$S3_BUCKET \
        LambdaCodePrefix=lambdas/
}

deploy_orders_lambda() {
    echo "Deploying orders lambda functions"
    aws cloudformation deploy \
        --template-file infrastructure/templates/orders-stack.yaml \
        --stack-name chainopt-orders-stack-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
        Environment=$ENVIRONMENT \
        LambdaCodeBucket=$S3_BUCKET \
        LambdaCodePrefix=lambdas/
}

deploy_api() {
    echo "Deploying API Gateway"
    aws cloudformation deploy \
        --template-file infrastructure/templates/inventory-api.yaml \
        --stack-name chainopt-api-$ENVIRONMENT-$REGION \
        --capabilities CAPABILITY_NAMED_IAM
}

deploy_all() {
    echo "Deploying all resources"
    deploy_iam_roles
    deploy_infra
    deploy_database
    deploy_secret_manager
    deploy_rds
    package_lambda
    deploy_lambda
    package_orders_lambda
    deploy_orders_lambda
    deploy_api
}

upload_lambdas_to_s3() {
    echo "Uploading lambda functions to S3"
    for file in infrastructure/build/*.zip; do
        filename=$(basename "$file")
        s3_key="lambdas/${filename}"
        echo "Uploading $filename to s3://$S3_BUCKET/$s3_key"
        aws s3 cp "$file" "s3://$S3_BUCKET/$s3_key"
    done

}

# Uncomment the desired function to deploy specific resources
# deploy_iam_roles
deploy_infra
# deploy_database
# deploy_secret_manager
# deploy_rds
# package_lambda_inventory
# deploy_lambda
# package_orders_lambda
# deploy_orders_lambda
# deploy_api
# deploy_all
#  upload_lambdas_to_s3
