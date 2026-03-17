// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Vérifie si la route est marquée publique
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Route publique → pas de vérification des rôles
      return true;
    }

    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      // Aucune restriction de rôle → autorisé
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
