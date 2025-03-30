import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import csv from 'csv-parser';
import type { CSVRow } from '../types';

const s3 = new S3Client({ region: 'eu-central-1' });
const BUCKET_NAME = process.env.BUCKET_NAME || 'chainopt-ml-models';
const FILE_KEY = process.env.FILE_KEY || 'predictions/forecast_results.csv';

const streamToJSON = async (stream: Readable): Promise<Record<string, string>[]> => {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => {
        stream.destroy();
        reject(err);
      });
  });
};

export const fetchForecastData = async (productId: string): Promise<CSVRow[]> => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY });
  const response = await s3.send(command);
  const stream = response.Body as Readable;

  const records = await streamToJSON(stream);
  return records
    .filter((row) => row.item_id === productId)
    .map((row) => ({
      item_id: row.item_id,
      date: row.date,
      predicted_value: row.predicted_value,
      lower_bound: row.lower_bound,
      upper_bound: row.upper_bound,
    }));
};
