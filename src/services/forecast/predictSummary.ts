import type { APIGatewayProxyHandler } from 'aws-lambda';
import { fetchForecastData } from '../../utils/fetchForecastData';
import { errorResponse, successResponse } from '../../utils/response';
import { OpenAI } from 'openai';
import { correlationId, StructuredLogger } from '../../utils/logger';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const getSecret = async () => {
  const secretName = process.env.SECRET_ID!;
  const client = new SecretsManagerClient({});
  const result = await client.send(new GetSecretValueCommand({ SecretId: secretName }));

  if (!result.SecretString) {
    throw new Error('[getSecret] SecretString is empty');
  }
  return result.SecretString;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'forecast-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  try {
    const secret = await getSecret();
    if (!secret) {
      logger.log('error', 'Failed to retrieve OpenAI API key', { correlationId });
      return errorResponse(new Error('Failed to retrieve OpenAI API key'), 500);
    }

    const openai = new OpenAI({
      apiKey: secret,
      timeout: 30000,
    });

    const productId = event.pathParameters?.productId;
    logger.log('info', 'Received summary request', { productId, correlationId });

    if (!productId) {
      logger.log('error', 'Missing productId in path parameters', { correlationId });
      return errorResponse(new Error('Missing productId'), 400);
    }

    let productName;
    if (event.body) {
      try {
        const parsedBody = JSON.parse(event.body);
        // Sanitize product name to prevent prompt injection
        productName = parsedBody.product_name
          ? String(parsedBody.product_name).replace(/[^\w\s-]/g, '')
          : undefined;
      } catch (e) {
        logger.log('error', 'Failed to parse request body', { error: e, correlationId });
        return errorResponse(new Error('Invalid request body format'), 400);
      }
    }

    logger.log('debug', 'Parsed product name from body', { productName, correlationId });

    const nameForPrompt = productName || 'this product';

    try {
      const forecast = await fetchForecastData(productId);
      logger.log('debug', 'Fetched forecast data', { forecast, correlationId });

      if (!forecast || forecast.length === 0) {
        logger.log('warn', 'No forecast data found', { productId, correlationId });
        return errorResponse(new Error('No forecast data found'), 404);
      }

      const forecastText = forecast
        .map(
          (entry) =>
            `${entry.date}: predicted=${Math.round(Number(entry.predicted_value))}, range=(${Math.round(Number(entry.lower_bound))}-${Math.round(Number(entry.upper_bound))})`,
        )
        .join('\n');

      logger.log('debug', 'Constructed forecast text for OpenAI prompt', {
        forecastText,
        correlationId,
      });

      const prompt = `
You are a supply chain analyst for a bakery.

The following is a 7-day sales forecast for **${nameForPrompt}**, showing predicted number of units sold per day with lower and upper bound estimates.

Write a clear 2–3 sentence **executive summary** describing:
- Whether demand is stable, increasing, or decreasing
- Which days are highest/lowest
- Any unusual spikes or drops
- What action the bakery should take
- Any other relevant observations

Use this format for each day (numbers should be rounded):
Date: predicted=X, range=(Y-Z)

Format your response professionally.

${forecastText}
`;

      logger.log('debug', 'Sending prompt to OpenAI', { prompt, correlationId });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful supply chain assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const summary = completion.choices[0]?.message.content ?? 'No summary generated.';
      logger.log('info', 'Generated forecast summary', { productId, summary, correlationId });

      return successResponse({
        message: 'Forecast summary generated',
        data: { product_id: productId, summary },
      });
    } catch (err) {
      logger.log('error', 'Error generating forecast summary', {
        error: err instanceof Error ? err.message : 'Unknown error',
        correlationId,
      });
      return errorResponse(new Error('Failed to generate forecast summary'), 500);
    }
  } catch (err) {
    logger.log('error', 'Error retrieving secret', {
      error: err instanceof Error ? err.message : 'Unknown error',
      correlationId,
    });
    return errorResponse(new Error('Failed to retrieve secret'), 500);
  }
};
