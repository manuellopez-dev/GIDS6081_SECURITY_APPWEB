import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          message = (resp.message as string[]).join(', ');
        } else if (typeof resp.message === 'string') {
          message = resp.message;
        }
      }
    } else if (this.isPrismaError(exception)) {
      // Manejar errores conocidos de Prisma sin exponer detalles técnicos
      const prismaError = exception as any;

      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        // Identificar qué campo está duplicado
        const field = prismaError.meta?.target?.[0] || '';
        if (field.includes('email')) {
          message = 'El correo electrónico ya está registrado';
        } else if (field.includes('username')) {
          message = 'El nombre de usuario ya está en uso';
        } else {
          message = 'Ya existe un registro con esos datos';
        }
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'El registro solicitado no existe';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Error al procesar la solicitud';
      }

      this.logger.error(
        `Prisma error ${prismaError.code} en ${request.method} ${request.url}`,
      );
    } else {
      this.logger.error(
        `Error no controlado en ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      'clientVersion' in exception
    );
  }
}