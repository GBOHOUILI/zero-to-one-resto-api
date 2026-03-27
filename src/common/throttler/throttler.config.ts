// src/common/throttler/throttler.config.ts
// Configuration du Rate Limiting global

import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'short', // Limite courte : anti-burst
      ttl: 1000, // fenêtre de 1 seconde
      limit: 10, // max 10 requêtes par seconde
    },
    {
      name: 'medium', // Limite normale
      ttl: 60000, // fenêtre de 1 minute
      limit: 100, // max 100 requêtes/minute par IP
    },
  ],
};
