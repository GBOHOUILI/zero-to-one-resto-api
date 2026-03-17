// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || typeof user.role !== 'string') {
      return false;
    }

    // Normalisation → comparer en majuscules
    const normalizedUserRole = user.role.toUpperCase();
    const normalizedRequiredRoles = requiredRoles.map((role) =>
      role.toUpperCase(),
    );

    return normalizedRequiredRoles.includes(normalizedUserRole);
  }
}
