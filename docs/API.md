# ChainOpt API Documentation

This document provides detailed information about the ChainOpt API endpoints, including request and response formats, authentication requirements, and examples.

## Base URL

```
https://your-api-gateway-id.execute-api.your-region.amazonaws.com/dev
```

## Authentication

All API requests require authentication using an `Authorization` header with a valid JWT token:

```
Authorization: Bearer your-jwt-token
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Inventory Service

### List All Products

Returns a paginated list of all products across all warehouses.

**Endpoint:** `GET /products`

**Query Parameters:**
- `limit` (optional): Number of items per page (default: 100, max: 1000)
- `offset` (optional): Pagination token for next page

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Products retrieved successfully",
    "data": [
      {
        "product_id": "PROD-12345678",
        "product_name": "Chocolate Chip Cookies",
        "stock_level": 250,
        "warehouse_id": "WH-001",
        "category": "Baked Goods",
        "supplier": "Sweet Treats Inc."
      }
    ],
    "pagination": {
      "next_offset": "eyJwcm9kdWN0X2lkIjoiUFJPRC0xMjM0NTY3OCIsIndhcmVob3VzZV9pZCI6IldILTAwMSJ9"
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### Get Product Details

Returns details for a specific product in a specific warehouse.

**Endpoint:** `GET /products/{productId}`

**Query Parameters:**
- `warehouseId` (required): Warehouse ID

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Product retrieved successfully",
    "data": {
      "product_id": "PROD-12345678",
      "warehouse_id": "WH-001",
      "product_name": "Chocolate Chip Cookies",
      "stock_level": 250,
      "reorder_threshold": 100,
      "supplier": "Sweet Treats Inc.",
      "category": "Baked Goods",
      "last_updated": "2023-08-15"
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### Add New Product

Creates a new product record.

**Endpoint:** `POST /products`

**Request Body:**

```json
{
  "product_name": "Chocolate Chip Cookies",
  "warehouse_id": "WH-001",
  "stock_level": 250,
  "reorder_threshold": 100,
  "supplier": "Sweet Treats Inc.",
  "category": "Baked Goods"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Product added successfully",
    "data": {
      "product_id": "PROD-12345678",
      "name": "Chocolate Chip Cookies",
      "stock_level": 250
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### Update Product

Updates an existing product.

**Endpoint:** `PUT /products/{productId}`

**Query Parameters:**
- `warehouseId` (required): Warehouse ID

**Request Body:**

```json
{
  "stock_level": 300,
  "reorder_threshold": 150
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Product updated successfully",
    "data": {
      "product_id": "PROD-12345678",
      "updated_fields": ["stock_level", "reorder_threshold"]
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### Delete Product

Deletes a product from a warehouse.

**Endpoint:** `DELETE /products/{productId}`

**Query Parameters:**
- `warehouseId` (required): Warehouse ID

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Product deleted successfully",
    "data": {
      "product_id": "PROD-12345678"
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### List Warehouse Products

Returns all products in a specific warehouse.

**Endpoint:** `GET /warehouses/{warehouseId}/products`

**Query Parameters:**
- `limit` (optional): Number of items per page (default: 100, max: 1000)
- `offset` (optional): Pagination token for next page

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Products retrieved successfully",
    "data": [
      {
        "product_id": "PROD-12345678",
        "product_name": "Chocolate Chip Cookies",
        "stock_level": 250
      }
    ],
    "pagination": {
      "next_offset": "eyJwcm9kdWN0X2lkIjoiUFJPRC0xMjM0NTY3OCJ9"
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### Transfer Product

Transfers products between warehouses.

**Endpoint:** `POST /transfers`

**Request Body:**

```json
{
  "product_id": "PROD-12345678",
  "from_warehouse": "WH-001",
  "to_warehouse": "WH-002",
  "quantity": 50
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Product transferred successfully",
    "data": {
      "product_id": "PROD-12345678",
      "quantity_transferred": 50,
      "from_warehouse": "WH-001",
      "to_warehouse": "WH-002"
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

---

## Order Service

### List Orders

Returns a list of orders, optionally filtered by status.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `status` (optional): Filter by order status ('Pending', 'Completed', 'Cancelled')

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "order_id": "f4b3d782-43c6-48cf-8c36-3b60c8cf1c72",
      "product_id": "PROD-12345678",
      "quantity": 100,
      "status": "Pending",
      "created_at": "2023-08-15T14:30:00.000Z"
    }
  ],
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### Create Order

Creates a new order.

**Endpoint:** `POST /orders`

**Request Body:**

```json
{
  "product_id": "PROD-12345678",
  "warehouse_id": "WH-001",
  "quantity": 100,
  "status": "Pending"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Order created successfully",
    "order_id": "f4b3d782-43c6-48cf-8c36-3b60c8cf1c72"
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

---

## Forecast Service

### Get Product Forecast

Returns forecast data for a specific product.

**Endpoint:** `GET /forecast/{productId}`

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Predictions fetched successfully",
    "data": [
      {
        "date": "2023-08-16",
        "predicted_value": 120,
        "lower_bound": 100,
        "upper_bound": 140
      },
      {
        "date": "2023-08-17",
        "predicted_value": 125,
        "lower_bound": 105,
        "upper_bound": 145
      }
    ]
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```

### Get Forecast Summary

Returns an AI-generated summary of the forecast data for a specific product.

**Endpoint:** `GET /forecast/{productId}/summary`

**Request Body (optional):**

```json
{
  "product_name": "Chocolate Chip Cookies"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Forecast summary generated",
    "data": {
      "product_id": "PROD-12345678",
      "summary": "Demand for Chocolate Chip Cookies is expected to remain stable over the next 7 days, with a slight increase on weekends. The highest demand is predicted for Saturday (145 units) while Tuesday shows the lowest demand (105 units). Consider increasing production slightly for weekend delivery."
    }
  },
  "timestamp": "2023-08-15T14:30:00.000Z"
}
```
