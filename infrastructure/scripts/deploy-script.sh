#!/bin/bash

# Testing Script
# Variables
S3_BUCKET=chainopt-cf-artifacts
S3_PREFIX=lambdas
deploy_iam_roles() {
    aws cloudformation deploy   --template-file infrastructure/templates/iam.yml \
        --stack-name ChainOptIamRoles \
        --capabilities CAPABILITY_NAMED_IAM
}

deploy_database() {
    aws cloudformation deploy   --template-file infrastructure/templates/database.yml \
        --stack-name ChainOptDatabase \
        --capabilities CAPABILITY_NAMED_IAM
}

package_lambda() {
    echo "Packaging lambda functions"
    aws cloudformation package --template-file infrastructure/templates/inventory-stack.yaml \
        --s3-bucket $S3_BUCKET \
        --s3-prefix $S3_PREFIX \
        --output-template-file infrastructure/templates/packaged/inventory-stack-packaged.yaml
}

deploy_lambda() {
    echo "Deploying lambda functions"
    aws cloudformation deploy --template-file infrastructure/templates/packaged/inventory-stack-packaged.yaml \
        --stack-name ChainOptInventoryStack \
        --capabilities CAPABILITY_NAMED_IAM
}

update_inventory_stack() {
    echo "Updating inventory stack"
aws cloudformation update-stack --stack-name ChainOptInventoryStack --template-body file://infrastructure/templates/packaged/inventory-stack-packaged.yaml --capabilities CAPABILITY_NAMED_IAM
}

deploy_all() {
    echo "Deploying all resources"
    deploy_iam_roles
    package_lambda
    deploy_lambda
}

deploy_all
