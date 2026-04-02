import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Public } from '../auth/public.decorator';

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
  @ApiOperation({
    summary: 'Créer une commande et obtenir le lien WhatsApp',
    description:
      'Enregistre le panier en DB, génère un ID de commande court (#ZO-XXXXX) ' +
      'et retourne l\'URL WhatsApp pré-remplie avec les détails de la commande.',
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
