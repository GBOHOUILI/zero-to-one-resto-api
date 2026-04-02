import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'] ?? '';
    const startTime = Date.now();

    // Infos tenant/user injectées par le JWT guard et le tenant middleware
    const user = (req as any).user;
    const tenantId = (req as any).tenantId ?? user?.restaurantId ?? 'public';
    const userId = user?.id ?? 'anonymous';
    const role = user?.role ?? '-';

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length') ?? '-';

      // Niveau de log selon le status code
      const logLevel =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      this.logger[logLevel](
        `[${method}] ${originalUrl} → ${statusCode} | ` +
          `${duration}ms | ${contentLength}B | ` +
          `user=${userId} role=${role} tenant=${tenantId} | ` +
          `ip=${ip} agent="${userAgent}"`,
      );
    });

    next();
  }
}
