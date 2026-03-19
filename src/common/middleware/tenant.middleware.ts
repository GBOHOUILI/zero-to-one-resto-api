// src/tenants/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';

export interface TenantRequest extends Request {
  tenantId?: string | null;
  tenantHost?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const host = req.headers.host;
    if (!host) {
      req.tenantId = null;
      return next();
    }

    const hostname = host.split(':')[0];
    req.tenantHost = hostname;
    req.tenantId = await this.tenantService.resolveTenant(hostname);

    next();
  }
}
