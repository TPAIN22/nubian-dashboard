/**
 * Client-side logging utility
 * Provides structured logging for the frontend application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'error':
        console.error(formattedMessage, context || '');
        // In production, you might want to send errors to an error tracking service
        if (!this.isDevelopment) {
          // Example: Send to error tracking service (Sentry, LogRocket, etc.)
          // errorTrackingService.captureException(new Error(message), context);
        }
        break;
      case 'warn':
        console.warn(formattedMessage, context || '');
        break;
      case 'info':
        console.info(formattedMessage, context || '');
        break;
      case 'debug':
        console.debug(formattedMessage, context || '');
        break;
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
export default logger;

