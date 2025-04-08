# ChainOpt — Enterprise Supply Chain Optimization Platform

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/serverless/)

A robust cloud-based inventory optimization system utilizing AI forecasting to enhance supply chain efficiency for eCommerce businesses, warehouses, and retailers.

**ChainOpt brings enterprise-grade supply chain management to businesses of all sizes with AI-powered forecasting, real-time inventory tracking, and smart order management.**

[API Documentation](./docs/API.md) | [Deployment Guide](./infrastructure/templates/deployment-guide.md) | [Contributing Guide](./CONTRIBUTING.md)

---

## 🔑 Key Features

- **Real-time Inventory Management** — Track stock levels across multiple warehouses
- **Intelligent Order Processing** — Streamline purchasing and fulfillment workflows
- **AI-Powered Demand Forecasting** — Predict future inventory needs with machine learning
- **Smart Stock Alerts** — Receive notifications when inventory reaches reorder thresholds
- **Warehouse Transfer Management** — Move inventory between locations with full tracking
- **AI-Generated Insights** — Get actionable recommendations via OpenAI integration
- **RESTful API** — Integrate with existing systems and frontends

---

## 🛠 Tech Stack

### Backend

- Node.js (TypeScript) on AWS Lambda for scalable, event-driven processing
- Serverless architecture for cost optimization and automatic scaling
- REST APIs with API Gateway for unified endpoint management

### Databases

- DynamoDB (NoSQL) for high-performance inventory and product data storage
- PostgreSQL (AWS RDS) for relational order data with ACID compliance

### AWS Services

- Lambda: Serverless compute for all business logic
- API Gateway: Centralized API management with authentication
- DynamoDB: Scalable NoSQL database for inventory
- RDS: Managed PostgreSQL for transactional order data
- S3: Object storage for forecast data and Lambda artifacts
- Secrets Manager: Secure credential storage for database connections
- CloudWatch: Comprehensive monitoring and logging

### AI & ML Integration

- AWS S3 for storing forecast data and model outputs
- SageMaker Canvas for ML model training and faster development
- OpenAI for generating natural language forecast summaries

---

## ✅ Core Services

| Service                | Description                                              | Implementation        |
|------------------------|----------------------------------------------------------|----------------------|
| Inventory Service      | Tracks products, warehouses, and stock levels in real-time | Lambda + DynamoDB     |
| Order Management       | Handles sales/restocking orders with status tracking     | Lambda + RDS (PostgreSQL) |
| Forecasting Service    | Provides data-driven demand forecasts with confidence intervals | Lambda + S3          |
| AI Insights Service    | Generates business insights and recommendations via OpenAI | Lambda + OpenAI      |
| Notification Service   | Alerts stakeholders about low stock and order status changes | Lambda + SNS        |

---

## 🚀 Quick Start (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [esbuild](https://esbuild.github.io/) for bundling Lambda functions

### Clone the Repository

```bash
git clone https://github.com/Jswears/supply-chain-optimizer-backend.git
cd supply-chain-optimizer-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration values
```

### Build the Project

```bash
npx tsx esbuild.config.ts
```

This will:
- Compile TypeScript to JavaScript
- Bundle dependencies with esbuild
- Create deployment packages in `infrastructure/build/`


## 🚢 Deployment

ChainOpt is designed for deployment on AWS. Two deployment methods are available:

### 1. Automated Deployment (Recommended)

```bash
# Set environment variables
export ENVIRONMENT=dev  # Can be dev, staging, or prod
export REGION=eu-central-1
export S3_BUCKET=chainopt-cf-artifacts

# Run the deployment script
cd infrastructure/scripts
./deploy-script.sh
```

The script provides an interactive menu to deploy all components or select specific services.

### 2. Manual Deployment

For more control, deploy individual components:

1. Infrastructure (VPC, subnets, security groups)
2. IAM roles and permissions
3. DynamoDB tables for inventory
4. RDS PostgreSQL for orders
5. Lambda functions for business logic
6. API Gateway for unified API access

Detailed step-by-step instructions are available in our [Deployment Guide](./infrastructure/templates/deployment-guide.md).

---

## 📚 API Documentation

ChainOpt provides a comprehensive REST API. Here's a summary of available endpoints:

### Inventory Service Endpoints

| Method | Endpoint                          | Description                                          |
|--------|-----------------------------------|------------------------------------------------------|
| GET    | `/products`                       | List all products with pagination                    |
| GET    | `/products/{id}`                  | Get details for a specific product                   |
| POST   | `/products`                       | Create a new product                                 |
| PUT    | `/products/{id}`                  | Update an existing product                           |
| DELETE | `/products/{id}`                  | Delete a product                                     |
| GET    | `/warehouses/{id}/products`       | Get all products in a warehouse                      |
| POST   | `/transfers`                      | Transfer stock between warehouses                    |

### Order Service Endpoints

| Method | Endpoint                          | Description                                          |
|--------|-----------------------------------|------------------------------------------------------|
| GET    | `/orders`                         | List all orders with status filtering               |
| POST   | `/orders`                         | Create a new order                                  |
| GET    | `/orders/{id}`                    | Get details for a specific order                    |
| PUT    | `/orders/{id}`                    | Update an existing order                            |
| DELETE | `/orders/{id}`                    | Delete an order                                     |

### Forecast Service Endpoints

| Method | Endpoint                          | Description                                          |
|--------|-----------------------------------|------------------------------------------------------|
| GET    | `/forecast/{productId}`           | Get forecast data for a product                      |
| POST   | `/forecast/{productId}/summary`   | Get AI-generated forecast summary with recommendations |

For complete API documentation, request/response formats, and examples, see our [API Documentation](./docs/API.md).

---

## 🔍 Monitoring and Maintenance

ChainOpt provides several tools for monitoring and maintaining your deployment:

### CloudWatch Logs

All Lambda functions output structured logs to CloudWatch for troubleshooting:


### Updating Lambda Functions

After making code changes:

```bash
# Build with esbuild
npx tsx esbuild.config.ts
# Or use the deploy script
npx tsx infrastructure/scripts/deploy-script.ts
```

# Deploy the updated function
cd infrastructure/scripts
./deploy-script.sh
```

### Database Maintenance

- **RDS Backups** - Automatic backups are managed by AWS RDS
- **DynamoDB** - Consider enabling point-in-time recovery for important tables

---

## 🛠️ Development

### Project Structure
```
supply-chain-optimizer-backend/
├── src/                  # Source code
│   ├── services/         # Lambda function handlers by service
│   │   ├── inventory/    # Inventory management functions
│   │   ├── orders/       # Order management functions
│   │   └── forecast/     # Forecasting functions
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Shared utilities
│       ├── validators/   # Input validation schemas
│       ├── dynamodb.ts   # DynamoDB utilities
│       ├── postgresDb.ts # PostgreSQL utilities
│       ├── response.ts   # API response formatting
│       └── logger.ts     # Structured logging
├── infrastructure/       # Infrastructure as Code and deployment artifacts
│   ├── build/            # Built Lambda packages
│   ├── scripts/          # Deployment and maintenance scripts
│   └── templates/        # CloudFormation templates
├── docs/                 # Documentation
├── dist/                 # Compiled code
└── esbuild.config.ts     # Build configuration
```

### Development Workflow

1. Create a feature branch from `dev`
2. Make changes following the coding standards
3. Build and test locally
4. Submit a PR to the `dev` branch

---

## 🔮 Roadmap

Future improvements planned for ChainOpt:

- Implement multi-tenant architecture for SaaS deployment
- Add GraphQL API support alongside REST
- Enhance ML models with more sophisticated prediction algorithms
- Build a dashboard for visualizing forecast data
- Implement full CI/CD pipeline with automated testing
- Add webhook support for integration with third-party systems
- Implement Dashboard section to receive the emails from vendors and suppliers and with help of OpenAI generate the emails to send to them to accept the orders, negotiate prices and cancel them with one click.
- Add support for multiple currencies and languages


---

## 🤝 Contributing

We welcome contributions to ChainOpt! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct, development workflow, and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Contact

- **Author:** Joaquin Swears Salinas
- **GitHub:** [Jswears](https://github.com/Jswears)

For questions or feedback, please open an issue on GitHub.
