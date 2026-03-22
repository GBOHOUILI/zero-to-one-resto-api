import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(
    restaurantId: string,
    userId: string,
    dto: CreateTicketDto,
  ) {
    return this.prisma.supportTicket.create({
      data: {
        subject: dto.subject,
        restaurant_id: restaurantId,
        messages: {
          create: {
            content: dto.content,
            sender_id: userId,
            is_admin: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });
  }

  async getAllTickets() {
    return this.prisma.supportTicket.findMany({
      include: {
        restaurant: { select: { name: true, slug: true } },
        messages: { orderBy: { created_at: 'asc' } },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getRestaurantTickets(restaurantId: string) {
    return this.prisma.supportTicket.findMany({
      where: { restaurant_id: restaurantId },
      include: { messages: { orderBy: { created_at: 'asc' } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async addMessage(
    ticketId: string,
    content: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');

    const message = await this.prisma.supportMessage.create({
      data: {
        ticket_id: ticketId,
        content,
        sender_id: userId,
        is_admin: isAdmin,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: isAdmin ? 'IN_PROGRESS' : 'OPEN',
        updated_at: new Date(),
      },
    });

    return message;
  }
}
