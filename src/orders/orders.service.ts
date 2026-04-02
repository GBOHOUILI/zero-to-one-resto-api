import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Génération de l'ID court unique: #ZO-XXXXX (base36, collision-safe)
  // ─────────────────────────────────────────────────────────────────────────────
  private generateShortId(): string {
    const timestamp = Date.now().toString(36).toUpperCase(); // ex: "LKHU4"
    const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // ex: "K3P"
    return `ZO-${timestamp}${random}`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Construction du message WhatsApp structuré
  // ─────────────────────────────────────────────────────────────────────────────
  buildWhatsAppMessage(orderId: string, items: CreateOrderDto['items'], note?: string): string {
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

    if (note) {
      lines.push(``, `📝 Note : ${note}`);
    }

    return lines.join('\n');
  }

  private calcTotal(items: CreateOrderDto['items']): number {
    return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Créer une commande + retourner le lien WhatsApp
  // ─────────────────────────────────────────────────────────────────────────────
  async createOrder(dto: CreateOrderDto, ip: string, userAgent: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Le panier ne peut pas être vide');
    }

    // 1. Vérifier que le restaurant existe et récupérer le numéro WhatsApp
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurant_id },
      include: { contacts: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }

    const whatsappNumber = restaurant.contacts?.whatsapp;
    if (!whatsappNumber) {
      throw new BadRequestException(
        'Ce restaurant n\'a pas configuré son numéro WhatsApp',
      );
    }

    // 2. Générer l'ID court et calculer le total
    const shortId = this.generateShortId();
    const totalAmount = this.calcTotal(dto.items);

    // 3. Persister la commande en base (tracking + analytics)
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

    // 4. Aussi logguer dans analytics
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          restaurant_id: dto.restaurant_id,
          event_type: 'WHATSAPP_CLICK',
          page: 'cart',
          ip,
          user_agent: userAgent,
          session_id: shortId,
        },
      });
    } catch (e) {
      // Ne bloque pas la commande si analytics échoue
      this.logger.warn(`Analytics tracking failed for order ${shortId}: ${e.message}`);
    }

    // 5. Construire l'URL WhatsApp encodée
    const message = this.buildWhatsAppMessage(shortId, dto.items, dto.note);
    const encodedMessage = encodeURIComponent(message);
    // Normaliser le numéro: supprimer les espaces et le "+"
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Dashboard: statistiques commandes pour un restaurant
  // ─────────────────────────────────────────────────────────────────────────────
  async getOrderStats(restaurantId: string) {
    const [total, totalAmount, recent] = await Promise.all([
      this.prisma.order.count({ where: { restaurant_id: restaurantId } }),
      this.prisma.order.aggregate({
        where: { restaurant_id: restaurantId },
        _sum: { total_amount: true },
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
      recent_orders: recent,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Lister toutes les commandes (Super Admin — plateforme entière)
  // ─────────────────────────────────────────────────────────────────────────────
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
