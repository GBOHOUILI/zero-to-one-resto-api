import { SetMetadata } from '@nestjs/common';

// "isPublic" est le nom du metadata que le guard va lire
export const Public = () => SetMetadata('isPublic', true);
