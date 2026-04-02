import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ─── ID court unique: ZO-XXXXX ────────────────────────────────────────────
  private generateShortId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ZO-${timestamp}${random}`;
  }

  // ─── Message WhatsApp ─────────────────────────────────────────────────────
  buildWhatsAppMessage(
    orderId: string,
    items: CreateOrderDto['items'],
    note?: string,
  ): string {
    const lines = [
      `🧾 *Nouvelle Commande #${orderId}*`,
      ``,
      ...items.map(
        (item) =>
          `• ${item.quantity}x ${item.name} — ${(item.unit_price * item.quantity).toLocaleString('fr-FR')} FCFA`,
      ),
      ``,
      `💰 *Total : ${this.calcTotal(items).toLocaleString('fr-FR')} FCFA*`,
    ];
    if (note) lines.push(``, `📝 Note : ${note}`);
    return lines.join('\n');
  }

  private calcTotal(items: CreateOrderDto['items']): number {
    return items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
  }

  // ─── Créer une commande + notifier le proprio ─────────────────────────────
  async createOrder(dto: CreateOrderDto, ip: string, userAgent: string) {
    if (!dto.items?.length) {
      throw new BadRequestException('Le panier ne peut pas être vide');
    }

    // 1. Récupérer le restaurant + email du propriétaire
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurant_id },
      include: {
        contacts: true,
        owner: { select: { email: true } },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    const whatsappNumber = restaurant.contacts?.whatsapp;
    if (!whatsappNumber) {
      throw new BadRequestException(
        "Ce restaurant n'a pas configuré son numéro WhatsApp",
      );
    }

    const shortId = this.generateShortId();
    const totalAmount = this.calcTotal(dto.items);

    // 2. Persister en base
    const order = await this.prisma.order.create({
      data: {
        short_id: shortId,
        restaurant_id: dto.restaurant_id,
        customer_phone: dto.customer_phone ?? null,
        note: dto.note ?? null,
        total_amount: totalAmount,
        status: 'PENDING',
        ip,
        user_agent: userAgent,
        items: {
          create: dto.items.map((item) => ({
            item_id: item.item_id,
            name: item.name,
            unit_price: item.unit_price,
            quantity: item.quantity,
            subtotal: item.unit_price * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // 3. Analytics (non bloquant)
    this.prisma.analyticsEvent
      .create({
        data: {
          restaurant_id: dto.restaurant_id,
          event_type: 'WHATSAPP_CLICK',
          page: 'cart',
          ip,
          user_agent: userAgent,
          session_id: shortId,
        },
      })
      .catch((e) =>
        this.logger.warn(`Analytics failed for ${shortId}: ${e.message}`),
      );

    // 4. Notification email au proprio (non bloquant — ne bloque jamais le client)
    if (restaurant.owner?.email) {
      this.mailService
        .sendNewOrderNotification(restaurant.owner.email, restaurant.name, {
          short_id: shortId,
          total_amount: totalAmount,
          note: dto.note,
          customer_phone: dto.customer_phone,
          items: order.items,
        })
        .catch((e) =>
          this.logger.warn(
            `Notification email échouée pour commande ${shortId}: ${e.message}`,
          ),
        );
    }

    // 5. URL WhatsApp
    const message = this.buildWhatsAppMessage(shortId, dto.items, dto.note);
    const encodedMessage = encodeURIComponent(message);
    const normalizedPhone = whatsappNumber.replace(/[\s+\-()]/g, '');
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

    return {
      order_id: order.id,
      short_id: shortId,
      total_amount: totalAmount,
      whatsapp_url: whatsappUrl,
      message,
    };
  }

  // ─── Stats restaurant ─────────────────────────────────────────────────────
  async getOrderStats(restaurantId: string) {
    const [total, totalAmount, byStatus, recent] = await Promise.all([
      this.prisma.order.count({ where: { restaurant_id: restaurantId } }),
      this.prisma.order.aggregate({
        where: { restaurant_id: restaurantId },
        _sum: { total_amount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { restaurant_id: restaurantId },
        _count: { _all: true },
      }),
      this.prisma.order.findMany({
        where: { restaurant_id: restaurantId },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: { items: true },
      }),
    ]);

    return {
      total_orders: total,
      potential_revenue: totalAmount._sum.total_amount ?? 0,
      by_status: byStatus.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      recent_orders: recent,
    };
  }

  // ─── Toutes les commandes (Super Admin) ───────────────────────────────────
  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          restaurant: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.order.count(),
    ]);

    return {
      data: orders,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }
}
