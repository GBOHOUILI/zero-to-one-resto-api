// src/common/guards/orders-throttler.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Guard de rate limiting strict pour POST /orders.
 * Limite : 5 commandes par IP par minute — anti-spam et anti-flood.
 * S'applique en plus du throttling global.
 */
@Injectable()
export class OrdersThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // On rate-limit par IP, en tenant compte des proxies
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    return `orders:${ip}`;
  }

  protected errorMessage =
    'Trop de commandes envoyées. Réessayez dans une minute.';
}
