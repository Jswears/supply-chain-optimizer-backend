# ChainOpt — Supply Chain Optimization SaaS Backend

A cloud-based inventory optimization system utilizing AI forecasting to enhance supply chain efficiency for eCommerce, warehouses, and retailers.

---

## 🛠 Tech Stack

### Backend

- Node.js (TypeScript), Python

### Architecture

- Serverless microservices on AWS
- Event-driven architecture
- REST APIs with API Gateway and Lambda

### Databases

- DynamoDB (NoSQL) for inventory and product data
- PostgreSQL (AWS RDS) for relational data

### AWS Services

- Lambda: Serverless compute
- API Gateway: API management
- DynamoDB: NoSQL database
- RDS: Relational database
- EventBridge: Event bus
- S3: Object storage
- Cognito: Authentication
- CloudFormation: Infrastructure as Code
- CloudWatch: Monitoring and logging

---

## ✅ Core Services

| Service                | Description                                   | Implementation       |
| ---------------------- | --------------------------------------------- | -------------------- |
| Inventory Service      | Tracks products, warehouses, and stock levels | Lambda + DynamoDB    |
| Order Management       | Handles sales/restocking orders               | Lambda + RDS         |
| AI Forecasting Service | Predicts demand trends via AWS Forecast       | Lambda + SageMaker   |
| AI Insights Service    | Generates business insights via OpenAI        | Lambda + SQS + OpenAI|
| Notifications Service  | Sends low-stock and recommendation alerts     | EventBridge + SNS    |
| Auth Service           | Secure user authentication                    | Cognito + Lambda     |

---

## 🚀 Quick Start (Dev)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) (optional, for local testing)

### Clone the Repository

```bash
git clone https://github.com/Jswears/chainopt.git
```

### Navigate to the Backend Directory

```bash
cd chainopt/supply-chain-optimizer-backend/
```

### Install Dependencies

```bash
npm install
```

### Deploy to AWS

```bash
cd infrastructure/scripts
./deploy-script.sh
```

### Cleanup Resources

When you're done, clean up all AWS resources to avoid unnecessary charges:

```bash
cd infrastructure/scripts
./delete-script.sh
```

## 📚 API Documentation

The ChainOpt API provides a unified interface to manage products, warehouses, and orders.

### Products Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products with pagination |
| GET | `/products/{id}` | Get details for a specific product |
| POST | `/products` | Create a new product |
| PUT | `/products/{id}` | Update an existing product |
| DELETE | `/products/{id}` | Delete a product |

### Warehouse Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses/{id}/products` | Get all products in a warehouse |

### Transfers Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transfers` | Transfer stock between warehouses |

### Orders Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List all orders with pagination |
| POST | `/orders` | Create a new order |

For detailed request/response examples, see our [API Documentation](./docs/API.md).

---

## 🛠️ Development

### Project Structure
supply-chain-optimizer-backend/
├── src/                  # Source code
│   ├── services/         # Lambda function handlers by service
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Shared utilities
├── infrastructure/       # Infrastructure as Code (CloudFormation)
│   ├── templates/        # CloudFormation templates
│   ├── scripts/          # Deployment scripts
│   └── build/            # Built Lambda packages
├── dist/                 # Compiled code
└── test/                 # Test files
