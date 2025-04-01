# ChainOpt — Supply Chain Optimization SaaS Backend

A cloud-based inventory optimization system utilizing AI forecasting to enhance supply chain efficiency for eCommerce, warehouses, and retailers.

---

## 🛠 Tech Stack

### Backend

- Node.js (TypeScript) on AWS Lambda

### Architecture

- Serverless microservices on AWS
- REST APIs with API Gateway and Lambda

### Databases

- DynamoDB (NoSQL) for inventory and product data
- PostgreSQL (AWS RDS) for order data

### AWS Services

- Lambda: Serverless compute
- API Gateway: API management
- DynamoDB: NoSQL database
- RDS: Relational database
- S3: Object storage for forecast data
- Secrets Manager: Secure credential storage
- CloudWatch: Monitoring and logging

### AI & ML

- AWS S3 for storing forecast data
- SageMaker Canvas for ML model training and faster development
- OpenAI for generating forecast summaries

---

## ✅ Core Services

| Service                | Description                                   | Implementation       |
| ---------------------- | --------------------------------------------- | -------------------- |
| Inventory Service      | Tracks products, warehouses, and stock levels | Lambda + DynamoDB    |
| Order Management       | Handles sales/restocking orders               | Lambda + RDS         |
| Forecasting Service    | Provides demand forecasts                     | Lambda + S3          |
| AI Insights Service    | Generates business insights via OpenAI        | Lambda + OpenAI      |

---

## 🚀 Quick Start (Dev)

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [esbuild](https://esbuild.github.io/) for bundling

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

### Deploy to AWS

See our [Deployment Guide](./DEPLOYMENT-GUIDE.md) for detailed instructions.

## 📚 API Documentation

### Inventory Service Endpoints

| Method | Endpoint                          | Description                                                       |
|--------|-----------------------------------|-------------------------------------------------------------------|
| GET    | `/products`                       | List all products with pagination                                 |
| GET    | `/products/{id}`                  | Get details for a specific product                                |
| POST   | `/products`                       | Create a new product                                              |
| PUT    | `/products/{id}`                  | Update an existing product                                        |
| DELETE | `/products/{id}`                  | Delete a product                                                  |
| GET    | `/warehouses/{id}/products`       | Get all products in a warehouse                                   |
| POST   | `/transfers`                      | Transfer stock between warehouses (Not working at the moment)     |

### Order Service Endpoints

| Method | Endpoint                          | Description                            |
|--------|-----------------------------------|----------------------------------------|
| GET    | `/orders`                         | List all orders with status filtering  |
| POST   | `/orders`                         | Create a new order                     |
| GET    | `/orders/{id}`                    | Get details for a specific order       |
| PUT    | `/orders/{id}`                    | Update an existing order               |
| DELETE | `/orders/{id}`                    | Delete an order                        |

### Forecast Service Endpoints

| Method | Endpoint                          | Description                            |
|--------|-----------------------------------|----------------------------------------|
| GET    | `/forecast/{productId}`           | Get forecast data for a product        |
| GET    | `/forecast/{productId}/summary`   | Get AI-generated forecast summary      |

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
├── infrastructure/       # Infrastructure as Code and build artifacts
│   └── build/            # Built Lambda packages
├── dist/                 # Compiled code
├── .vscode/              # VS Code configuration
├── .husky/               # Git hooks
├── esbuild.config.ts     # Build configuration
└── tsconfig.json         # TypeScript configuration
```

## 🤝 Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
