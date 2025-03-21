import type { ResponseBody } from '../types/utils';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

export const formatResponse = <T>(statusCode: number, body: ResponseBody<T>) => {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(body),
  };
};

export const successResponse = <T>(data: T) => formatResponse(200, { success: true, data });

export const errorResponse = (error: Error | string, statusCode = 500) => {
  const errorMessage = error instanceof Error ? error.message : error;
  console.error(errorMessage);
  return formatResponse(statusCode, {
    success: false,
    error: errorMessage,
  });
};
