# ChainOpt — Enterprise Supply Chain Optimization Platform

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/serverless/)

**ChainOpt** is a cloud-native inventory optimization platform leveraging AI forecasting to elevate supply chain efficiency for eCommerce businesses, warehouses, and retailers.

> **Enterprise-grade supply chain management for businesses of all sizes — powered by AI forecasting, real-time inventory tracking, and intelligent order workflows.**

📄 [API Documentation](./docs/API.md) | 🚀 [Deployment Guide](./infrastructure/templates/deployment-guide.md) | 🤝 [Contributing Guide](./CONTRIBUTING.md)

---

## 🔑 Key Features

- **Real-time Inventory Management** — Track stock across multiple warehouses
- **Intelligent Order Processing** — Streamline purchase and fulfillment workflows
- **AI-Powered Demand Forecasting** — Predict future demand using machine learning
- **Smart Stock Alerts** — Get notified when inventory reaches reorder thresholds
- **Warehouse Transfers** — Manage inventory movement between locations
- **AI-Generated Insights** — Actionable recommendations via OpenAI
- **RESTful API** — Integrate seamlessly with frontends or other systems

---

## 🛠 Tech Stack

### Backend

- **Node.js (TypeScript)** — Written with TypeScript for safety and clarity
- **AWS Lambda** — Scalable, event-driven compute
- **Serverless Architecture** — Cost-effective and autoscaling
- **API Gateway** — Unified, secured REST API layer

### Databases

- **DynamoDB** — High-performance NoSQL for inventory and warehouse data
- **PostgreSQL (RDS)** — Relational database for order transactions

### AWS Services

- **Lambda** — Business logic execution
- **API Gateway** — API routing, throttling, and auth
- **DynamoDB** — NoSQL storage for product and warehouse data
- **RDS (PostgreSQL)** — Managed relational database for orders
- **S3** — Forecast model storage and Lambda artifacts
- **Secrets Manager** — Securely store DB credentials
- **CloudWatch** — Monitoring and logging

### AI & ML

- **S3** — Stores training data and forecast outputs
- **SageMaker Canvas** — ML model building and tuning
- **OpenAI** — Generates natural language insights and summaries

---

## ✅ Core Services

| Service | Description | Implementation |
|---------|-------------|----------------|
| **Inventory Service** | Manages real-time tracking of products, warehouses, and stock levels | AWS Lambda + DynamoDB |
| **Order Management** | Processes sales/restocking orders and tracks status | AWS Lambda + RDS (PostgreSQL) |
| **Forecasting Service** | Provides demand forecasting using ML models | AWS Lambda + S3 |
| **AI Insights Service** | Uses OpenAI to generate forecasts and strategic insights | AWS Lambda + OpenAI API |
| **Notification Service** | Sends alerts for low stock and order status changes | AWS Lambda + Amazon SNS |

---

## 📚 API Documentation

ChainOpt offers a comprehensive REST API. Below is a summary of available endpoints:

### 📦 Inventory Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products with pagination |
| GET | `/products/{id}` | Get details for a specific product |
| POST | `/products` | Create a new product |
| PUT | `/products/{id}` | Update an existing product |
| DELETE | `/products/{id}` | Delete a product |
| GET | `/warehouses/{id}/products` | List products in a specific warehouse |
| POST | `/transfers` | Transfer stock between warehouses |

### 📑 Order Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List all orders (filterable by status) |
| POST | `/orders` | Create a new order |
| GET | `/orders/{id}` | Get details of a specific order |
| PUT | `/orders/{id}` | Update an order |
| DELETE | `/orders/{id}` | Delete an order |

### 📈 Forecasting Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/forecast/{productId}` | Get demand forecast data for a product |
| POST | `/forecast/{productId}/summary` | Generate AI-powered forecast summary and recommendations |

> For complete request/response formats and usage examples, see the [API Documentation](./docs/API.md).

---

## 🚀 Quick Start (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v22+)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [esbuild](https://esbuild.github.io/) for fast bundling

### Clone the Repository

```bash
git clone https://github.com/Jswears/supply-chain-optimizer-backend.git
cd supply-chain-optimizer-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your environment-specific values
```

### Build the Project

```bash
npx tsx esbuild.config.ts
```

> This compiles TypeScript, bundles dependencies, and generates deployable packages in `infrastructure/build/`.

---

## 🚢 Deployment

ChainOpt is designed for deployment on AWS using two approaches:

### 1. Automated Deployment (Recommended)

```bash
export ENVIRONMENT=dev       # or staging / prod
export REGION=eu-central-1
export S3_BUCKET=chainopt-cf-artifacts

cd infrastructure/scripts
./deploy-script.sh
```

> Interactive CLI allows full or partial deployment.

### 2. Manual Deployment

Deploy components individually for more control:

1. Networking (VPC, subnets)
2. IAM roles and policies
3. DynamoDB tables
4. RDS PostgreSQL setup
5. Lambda functions
6. API Gateway

See the [Deployment Guide](./infrastructure/templates/deployment-guide.md) for details.

---

## 🔍 Monitoring and Maintenance

### Logging

All Lambdas output structured logs to **CloudWatch**.

### Updating Functions

After making changes:

```bash
npx tsx esbuild.config.ts
cd infrastructure/scripts
./deploy-script.sh
```

### Database Maintenance

- **RDS:** Automatic backups enabled by AWS
- **DynamoDB:** Enable point-in-time recovery for critical tables

---

## 🧱 Project Structure

```
supply-chain-optimizer-backend/
├── src/
│   ├── services/         # Lambda handlers by domain
│   │   ├── inventory/
│   │   ├── orders/
│   │   └── forecast/
│   ├── types/            # TypeScript interfaces and types
│   └── utils/            # Shared utilities
│       ├── validators/   # Input validation
│       ├── dynamodb.ts
│       ├── postgresDb.ts
│       ├── response.ts
│       └── logger.ts
├── infrastructure/
│   ├── build/            # Compiled deployment packages
│   ├── scripts/          # Deploy scripts
│   └── templates/        # CloudFormation templates
├── docs/                 # API and dev docs
├── dist/                 # Output from build
└── esbuild.config.ts     # Build configuration
```

---

## 💻 Development Workflow

1. Create a feature branch from `dev`
2. Make your changes following code standards
3. Build and test locally
4. Open a Pull Request to `dev`

---

## 🔮 Roadmap

Planned improvements for ChainOpt:

- Multi-tenant support (SaaS architecture)
- GraphQL API alongside REST
- Enhanced ML models for complex forecasts
- Admin dashboard with forecast visualizations
- Full CI/CD pipeline
- Webhook support for integrations
- Smart vendor email assistant (OpenAI-powered) for accepting/negotiating/canceling orders
- Multi-language and multi-currency support

---

## Frontend
The frontend for ChainOpt is available in a separate repository:
**Frontend**: [ChainOpt Frontend](https://github.com/Jswears/supply-chain-optimizer-frontend)



## 🤝 Contributing

We welcome contributions! Check out the [Contributing Guide](./CONTRIBUTING.md) to get started.

---

## 📄 License

Licensed under the [MIT License](./LICENSE).

---

## 👥 Contact

- **Author:** Joaquin Swears Salinas
- **GitHub:** [@Jswears](https://github.com/Jswears)

For questions or suggestions, please [open an issue](https://github.com/Jswears/supply-chain-optimizer-backend/issues).
