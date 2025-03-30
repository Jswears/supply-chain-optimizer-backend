import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import csv from 'csv-parser';
import { errorResponse, successResponse } from '../../utils/response';

const s3 = new S3Client({ region: 'eu-central-1' });
const BUCKET_NAME = process.env.BUCKET_NAME || 'chainopt-ml-models';
const FILE_KEY = process.env.FILE_KEY || 'predictions/forecast_results.csv';

const streamToJSON = async (stream: Readable): Promise<Record<string, string>[]> => {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    stream
      .pipe(csv())
      .on('data', (data: Record<string, string>) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => {
        stream.destroy(); // Ensure stream is destroyed on error
        reject(err);
      });
  });
};

interface APIGatewayEvent {
  pathParameters?: {
    productId?: string;
  };
}

interface Prediction {
  date: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
}

interface CSVRow {
  item_id: string;
  date: string;
  predicted_value: string;
  lower_bound: string;
  upper_bound: string;
}

export const handler = async (event: APIGatewayEvent) => {
  const productId = event.pathParameters?.productId;
  console.log('Received event:', event);
  console.log('Product ID:', productId);

  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or missing product_id' }) };
  }

  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY });
    const response = await s3.send(command);
    const stream = response.Body as Readable;

    const records = await streamToJSON(stream);

    // Filter predictions for the requested product
    const csvRows: CSVRow[] = records.map((record) => ({
      item_id: record.item_id || '',
      date: record.date || '',
      predicted_value: record.predicted_value || '',
      lower_bound: record.lower_bound || '',
      upper_bound: record.upper_bound || '',
    }));

    const predictions: Prediction[] = csvRows
      .filter((row) => row.item_id === productId)
      .map((row) => ({
        date: row.date,
        predicted_value: Number(row.predicted_value),
        lower_bound: Number(row.lower_bound),
        upper_bound: Number(row.upper_bound),
      }));

    return successResponse({
      message: 'Predictions fetched successfully',
      data: predictions,
    });
  } catch (err: unknown) {
    console.error('Prediction fetch error:', err instanceof Error ? err.message : err);
    return errorResponse(new Error('Failed to fetch predictions. Please try again later.'), 500);
  }
};
