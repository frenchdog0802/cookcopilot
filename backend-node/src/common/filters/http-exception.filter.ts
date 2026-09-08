import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { fail, failWithData } from '../api-response';
import { QuotaExceededError } from '../errors/http-errors';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof QuotaExceededError) {
      const body = exception.getResponse() as { message: string };
      response
        .status(HttpStatus.PAYMENT_REQUIRED)
        .json(failWithData(body.message, { quotaKey: exception.quotaKey }));
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const rawMessage = (exceptionResponse as { message: string | string[] })
          .message;
        message = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : rawMessage;
      } else {
        message = 'Request failed';
      }

      response.status(status).json(fail(message));
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(fail('Internal server error'));
  }
}
