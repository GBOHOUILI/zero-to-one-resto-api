import { SetMetadata } from '@nestjs/common';

// Décorateur pour assigner des rôles requis sur un endpoint
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
