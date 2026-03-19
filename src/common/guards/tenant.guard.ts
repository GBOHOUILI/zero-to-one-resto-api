// src/tenants/guards/tenant.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. On laisse passer si la route est marquée @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 2. Le Super Admin peut bypasser le Guard (car il n'est pas lié à un seul tenant)
    if (user?.role === 'SUPER_ADMIN') return true;

    // 3. Pour tous les autres (RESTO_ADMIN), le tenantId est obligatoire
    const tenantId = request.tenantId || user?.restaurantId;

    if (!tenantId) {
      throw new ForbiddenException(
        "Accès refusé : Aucun identifiant de restaurant (Tenant) n'a été détecté.",
      );
    }

    // On s'assure que le tenantId est bien attaché à la requête pour les services
    request.tenantId = tenantId;

    return true;
  }
}
