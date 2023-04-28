import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';

@Catch(AxiosError)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception?.response?.status;

    response
      .status(status)
      .json({
        statusCode: status,
        message: exception?.response?.data?.message || exception?.response?.data?.error || exception?.response?.data || exception?.message || exception?.error || exception,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}