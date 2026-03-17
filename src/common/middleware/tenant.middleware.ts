import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const host = req.headers.host;

    if (!host) {
      req.tenantHost = null;
      return next();
    }

    const hostname = host.split(':')[0];

    req.tenantHost = hostname;

    next();
  }
}
