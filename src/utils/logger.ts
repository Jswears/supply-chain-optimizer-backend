import winston from 'winston';
import WinstonCloudwatch from 'winston-cloudwatch';
import type { LogContext } from '../types/utils';

const { combine, timestamp, printf, align, json, colorize } = winston.format;

export class StructuredLogger {
  private logger: winston.Logger;
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
    this.logger = winston.createLogger({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        json(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
      ),
      transports: [
        new winston.transports.Console(),
        new WinstonCloudwatch({
          logGroupName: `/aws/${context.environment}/${context.service}`,
          logStreamName: `application-${new Date().toISOString().split('T')[0]}`,
          awsRegion: process.env.AWS_REGION,
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
      ...this.context,
      level: level.toUpperCase(),
      message,
      ...additionalData,
      timestamp: new Date().toISOString(),
    };
    switch (level) {
      case 'info':
        this.logger.info(logEntry);
        break;
      case 'warn':
        this.logger.warn(logEntry);
        break;
      case 'error':
        this.logger.error(logEntry);
        break;
      case 'debug':
        this.logger.debug(logEntry);
        break;
    }
  }
}
