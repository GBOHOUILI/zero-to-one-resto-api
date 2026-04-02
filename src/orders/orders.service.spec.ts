import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOrder = {
  id: 'order-uuid-1',
  short_id: 'ZO-TEST001',
  restaurant_id: 'resto-uuid-1',
  total_amount: 8000,
  status: 'PENDING',
  ip: '127.0.0.1',
  user_agent: 'jest',
  customer_phone: null,
  note: null,
  items: [
    {
      id: 'oi-1',
      order_id: 'order-uuid-1',
      item_id: 'item-1',
      name: 'Poulet braisé',
      unit_price: 4500,
      quantity: 1,
      subtotal: 4500,
    },
    {
      id: 'oi-2',
      order_id: 'order-uuid-1',
      item_id: 'item-2',
      name: 'Bissap',
      unit_price: 800,
      quantity: 1,
      subtotal: 800,
    },
  ],
};

const mockRestaurant = {
  id: 'resto-uuid-1',
  name: 'Chez Maman',
  contacts: { whatsapp: '+22961000001' },
  owner: { email: 'owner@chezmaman.bj' },
};

const mockPrisma = {
  restaurant: {
    findUnique: jest.fn().mockResolvedValue(mockRestaurant),
  },
  order: {
    create: jest.fn().mockResolvedValue(mockOrder),
    count: jest.fn().mockResolvedValue(5),
    findMany: jest.fn().mockResolvedValue([mockOrder]),
    aggregate: jest.fn().mockResolvedValue({ _sum: { total_amount: 40000 } }),
    groupBy: jest
      .fn()
      .mockResolvedValue([{ status: 'PENDING', _count: { _all: 3 } }]),
  },
  analyticsEvent: {
    create: jest.fn().mockResolvedValue({}),
  },
};

const mockMail = {
  sendNewOrderNotification: jest.fn().mockResolvedValue(undefined),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
    mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
    mockPrisma.order.create.mockResolvedValue(mockOrder);
  });

  // ─── buildWhatsAppMessage ────────────────────────────────────────────────
  describe('buildWhatsAppMessage', () => {
    it('génère un message WhatsApp correct avec les articles', () => {
      const items = [
        { item_id: 'i1', name: 'Poulet braisé', unit_price: 4500, quantity: 2 },
        { item_id: 'i2', name: 'Bissap', unit_price: 800, quantity: 1 },
      ];
      const msg = service.buildWhatsAppMessage('ZO-ABC123', items, 'Table 5');

      expect(msg).toContain('#ZO-ABC123');
      expect(msg).toContain('2x Poulet braisé');
      expect(msg).toContain('9 000'); // 4500 * 2 formaté
      expect(msg).toContain('Note : Table 5');
      expect(msg).toContain('9 800'); // total
    });

    it('génère un message sans note si non fournie', () => {
      const items = [
        { item_id: 'i1', name: 'Eau', unit_price: 500, quantity: 1 },
      ];
      const msg = service.buildWhatsAppMessage('ZO-XYZ', items);
      expect(msg).not.toContain('Note');
    });
  });

  // ─── createOrder ─────────────────────────────────────────────────────────
  describe('createOrder', () => {
    const validDto = {
      restaurant_id: 'resto-uuid-1',
      items: [
        {
          item_id: 'item-1',
          name: 'Poulet braisé',
          unit_price: 4500,
          quantity: 1,
        },
      ],
      customer_phone: '+22961000000',
      note: 'Table 3',
    };

    it('crée une commande et retourne un lien WhatsApp', async () => {
      const result = await service.createOrder(validDto, '127.0.0.1', 'jest');

      expect(result).toHaveProperty('short_id');
      expect(result).toHaveProperty('whatsapp_url');
      expect(result.whatsapp_url).toContain('wa.me');
      expect(result.whatsapp_url).toContain('22961000001');
      expect(result).toHaveProperty('total_amount', 4500);
    });

    it('enregistre la commande en base de données', async () => {
      await service.createOrder(validDto, '127.0.0.1', 'jest');
      expect(mockPrisma.order.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            restaurant_id: 'resto-uuid-1',
            status: 'PENDING',
          }),
        }),
      );
    });

    it('envoie une notification email au propriétaire', async () => {
      await service.createOrder(validDto, '127.0.0.1', 'jest');
      // Attendre les promises non-bloquantes
      await new Promise((r) => setTimeout(r, 10));
      expect(mockMail.sendNewOrderNotification).toHaveBeenCalledWith(
        'owner@chezmaman.bj',
        'Chez Maman',
        expect.objectContaining({ total_amount: 4500 }),
      );
    });

    it('lève BadRequestException si le panier est vide', async () => {
      await expect(
        service.createOrder({ ...validDto, items: [] }, '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it("lève NotFoundException si le restaurant n'existe pas", async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.createOrder(validDto, '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève BadRequestException si pas de WhatsApp configuré', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValueOnce({
        ...mockRestaurant,
        contacts: null,
      });
      await expect(
        service.createOrder(validDto, '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('normalise correctement le numéro WhatsApp (supprime +, espaces)', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValueOnce({
        ...mockRestaurant,
        contacts: { whatsapp: '+229 61 00 00 01' },
      });
      const result = await service.createOrder(validDto, '127.0.0.1', 'jest');
      expect(result.whatsapp_url).toContain('22961000001');
      expect(result.whatsapp_url).not.toContain('+');
      expect(result.whatsapp_url).not.toContain(' ');
    });
  });

  // ─── getOrderStats ────────────────────────────────────────────────────────
  describe('getOrderStats', () => {
    it('retourne les statistiques correctes', async () => {
      const stats = await service.getOrderStats('resto-uuid-1');
      expect(stats).toHaveProperty('total_orders', 5);
      expect(stats).toHaveProperty('potential_revenue', 40000);
      expect(stats).toHaveProperty('by_status');
      expect(stats).toHaveProperty('recent_orders');
    });
  });
});
