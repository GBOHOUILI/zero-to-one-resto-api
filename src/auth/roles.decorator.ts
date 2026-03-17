import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

// Décorateur pour assigner des rôles requis sur un endpoint
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
