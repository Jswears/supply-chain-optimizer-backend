import axios from 'axios';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { ProductsResponse } from '../../types/products';

const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const API_BASE_URL = process.env.API_BASE_URL!;
const SNS_TOPIC_ARN = process.env.LOW_STOCK_TOPIC_ARN!;

export const handler = async (): Promise<void> => {
  try {
    const response = await axios.get<ProductsResponse>(`${API_BASE_URL}/products`);
    console.log(response.data.data);
    const products = response.data.data.data;
    const lowStockProducts = products.filter((p) => p.stock_level < p.reorder_threshold);

    if (lowStockProducts.length === 0) {
      console.log('✅ No low stock products today.');
      return;
    }

    const message = lowStockProducts
      .map(
        (p) =>
          `🔻 ${p.product_name} (ID: ${p.product_id}) — Stock: ${p.stock_level}, Threshold: ${p.reorder_threshold}`,
      )
      .join('\n');

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,

        Subject: '📦 Daily Low Stock Report',
        Message: message,
      }),
    );

    console.log('✅ Low stock report sent via SNS.');
  } catch (error) {
    console.error('❌ Error in low stock check:', error);
    throw error;
  }
};
