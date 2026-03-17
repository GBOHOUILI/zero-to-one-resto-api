// src/tenants/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: any, res: any, next: () => void) {
    const host = req.headers.host;
    if (!host) {
      req.tenantId = null;
      return next();
    }

    const hostname = host.split(':')[0];
    req.tenantHost = hostname;

    // Récupération effective du restaurant via Redis / DB
    req.tenantId = await this.tenantService.resolveTenant(hostname);

    next();
  }
}
