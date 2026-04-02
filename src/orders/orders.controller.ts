import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Public } from '../auth/public.decorator';
import { OrdersThrottlerGuard } from '../common/guards/orders-throttler.guard';

@ApiTags('Client - Commandes')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Endpoint public — le client appelle ça quand il clique "Commander".
   * Enregistre la commande + retourne le lien WhatsApp + l'ID #ZO-XXX.
   */
  @Post()
  @Public()
  // Rate limit strict : 5 commandes max par minute par IP
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @UseGuards(OrdersThrottlerGuard)
  @ApiOperation({
    summary: 'Créer une commande et obtenir le lien WhatsApp',
    description:
      'Enregistre le panier en DB, génère un ID #ZO-XXXXX ' +
      "et retourne l'URL WhatsApp pré-remplie. Limité à 5 requêtes/min par IP.",
  })
  createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.ordersService.createOrder(dto, ip, userAgent);
  }
}
