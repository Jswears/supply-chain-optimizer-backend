// Logger
export interface LogContext {
  correlationId: string;
  service: string;
  environment: string;
  [key: string]: string | number | boolean;
}
