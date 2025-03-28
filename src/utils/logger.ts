import winston from 'winston';
import WinstonCloudwatch from 'winston-cloudwatch';
import type { LogContext } from '../types/utils';
import { v4 } from 'uuid';

const { combine, timestamp, json } = winston.format;

export const correlationId = v4();

export class StructuredLogger {
  private logger: winston.Logger;
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
    this.logger = winston.createLogger({
      level: 'debug',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), json()),
      transports: [
        new WinstonCloudwatch({
          logGroupName: `/aws/${context.environment}/${context.service}`,
          logStreamName: `application-${new Date().toISOString().split('T')[0]}`,
          awsRegion: process.env.AWS_REGION,
          jsonMessage: true,
        }),
        new winston.transports.Console({
          format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), json()),
        }),
      ],
    });
  }

  public log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    additionalData?: Record<string, unknown>,
  ): void {
    const logEntry = {
      level,
      message,
      ...this.context,
      ...additionalData,
      timestamp: new Date().toISOString(),
    };
    this.logger.log(level, logEntry);
  }
}
