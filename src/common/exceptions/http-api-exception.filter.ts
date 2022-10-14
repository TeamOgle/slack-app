import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpApiExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as
      | string
      | { error: string; statusCode: number; message: string[] };
    this.logger.error(errorResponse);
    if (typeof errorResponse === 'string') {
      response.status(status).json({ statusCode: status, message: errorResponse });
    } else {
      response.status(status).json(errorResponse);
    }
  }
}
