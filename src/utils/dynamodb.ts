import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  PutCommandInput,
  GetCommandInput,
  UpdateCommandInput,
  ScanCommandInput,
  QueryCommandInput,
  DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client and document client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Environment variable for table name
export const INVENTORY_TABLE_NAME = process.env.INVENTORY_TABLE_NAME || '';

// DynamoDB utility functions
export const dynamoDb = {
  put: async (params: PutCommandInput) => {
    const command = new PutCommand(params);
    return await docClient.send(command);
  },
  get: async (params: GetCommandInput) => {
    const command = new GetCommand(params);
    return await docClient.send(command);
  },
  scan: async (params: ScanCommandInput) => {
    const command = new ScanCommand(params);
    return await docClient.send(command);
  },
  query: async (params: QueryCommandInput) => {
    const command = new QueryCommand(params);
    return await docClient.send(command);
  },
  update: async (params: UpdateCommandInput) => {
    const command = new UpdateCommand(params);
    return await docClient.send(command);
  },
  delete: async (params: DeleteCommandInput) => {
    const command = new DeleteCommand(params);
    return await docClient.send(command);
  },
};
