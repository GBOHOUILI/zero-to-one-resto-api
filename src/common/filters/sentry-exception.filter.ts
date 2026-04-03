import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Filtre global qui :
 * 1. Capture toutes les exceptions non-HTTP (500) dans Sentry
 * 2. Enrichit le contexte Sentry avec user / tenant / route
 * 3. Renvoie une réponse formatée cohérente avec AllExceptionsFilter
 *
 * Remplace AllExceptionsFilter en production.
 * En dev (NODE_ENV !== 'production'), Sentry n'est pas initialisé,
 * le filtre log simplement dans la console.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error', statusCode: 500 };

    // ─── Sentry : capturer uniquement les 5xx ─────────────────────────────
    if (status >= 500) {
      const user = (request as any).user;
      const tenantId = (request as any).tenantId;

      Sentry.withScope((scope) => {
        // Contexte utilisateur
        if (user) {
          scope.setUser({
            id: user.id,
            email: user.email,
            role: user.role,
          });
        }

        // Contexte tenant et requête
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          tenantId: tenantId ?? 'public',
          ip:
            request.headers['x-forwarded-for']?.toString() ||
            request.socket.remoteAddress,
        });

        scope.setTag('tenant_id', tenantId ?? 'public');
        scope.setTag('http_method', request.method);
        scope.setTag('status_code', String(status));

        Sentry.captureException(exception);
      });

      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: typeof message === 'string' ? { message } : message,
    });
  }
}
