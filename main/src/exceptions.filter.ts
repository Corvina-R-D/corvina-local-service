import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';

@Catch(AxiosError)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception?.response?.status;
    const message = exception?.response?.data?.message || exception?.response?.data?.error || exception?.message || exception?.error;

    response
      .status(statusCode)
      .json({
        statusCode,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}