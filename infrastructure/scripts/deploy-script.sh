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
    aws cloudformation package --template-file infrastructure/templates/inventory-stack.yml \
        --s3-bucket $S3_BUCKET \
        --s3-prefix $S3_PREFIX \
        --output-template-file infrastructure/templates/packaged/inventory-stack-packaged.yml
}

package_lambda
