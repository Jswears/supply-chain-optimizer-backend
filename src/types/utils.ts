// Logger utils
export interface LogContext {
  correlationId: string;
  service: string;
  environment: string;
  [key: string]: string | number | boolean;
}

// Response utils
export type ResponseBody<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
