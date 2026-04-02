import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockRestaurant = {
  id: 'resto-abc',
  name: 'Le Bon Goût',
  slug: 'le-bon-gout',
  contacts: { whatsapp: '+22961000000' },
};

const mockItems = [
  { item_id: 'item-1', name: 'Poulet braisé', unit_price: 3500, quantity: 2 },
  { item_id: 'item-2', name: 'Jus de gingembre', unit_price: 1000, quantity: 1 },
];

const mockOrder = {
  id: 'order-uuid-1',
  short_id: 'ZO-LKHU4K3P',
  restaurant_id: 'resto-abc',
  total_amount: 8000,
  status: 'PENDING',
  created_at: new Date(),
  items: mockItems,
};

const mockPrisma: any = {
  restaurant: { findUnique: jest.fn() },
  order: {
    create: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  analyticsEvent: { create: jest.fn() },
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────
  // createOrder
  // ──────────────────────────────────────────────────
  describe('createOrder()', () => {
    const validDto = {
      restaurant_id: 'resto-abc',
      items: mockItems,
    };

    it('should create order and return whatsapp_url with short_id', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.analyticsEvent.create.mockResolvedValue({});

      const result = await service.createOrder(validDto as any, '41.1.1.1', 'Mozilla/5.0');

      expect(result.short_id).toMatch(/^ZO-/);
      expect(result.total_amount).toBe(8000);
      expect(result.whatsapp_url).toContain('wa.me');
      expect(result.whatsapp_url).toContain(encodeURIComponent('#ZO-').replace(/%20/g, '+').substring(0, 5));
    });

    it('should calculate correct total_amount', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.analyticsEvent.create.mockResolvedValue({});

      const result = await service.createOrder(validDto as any, 'ip', 'ua');

      // 3500 * 2 + 1000 * 1 = 8000
      expect(result.total_amount).toBe(8000);
    });

    it('should throw BadRequestException for empty cart', async () => {
      await expect(
        service.createOrder({ ...validDto, items: [] } as any, 'ip', 'ua'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when restaurant not found', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      await expect(service.createOrder(validDto as any, 'ip', 'ua')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when restaurant has no WhatsApp number', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...mockRestaurant,
        contacts: { whatsapp: null },
      });

      await expect(service.createOrder(validDto as any, 'ip', 'ua')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when restaurant has no contacts', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue({
        ...mockRestaurant,
        contacts: null,
      });

      await expect(service.createOrder(validDto as any, 'ip', 'ua')).rejects.toThrow(BadRequestException);
    });

    it('should include note in WhatsApp message when provided', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.analyticsEvent.create.mockResolvedValue({});

      const result = await service.createOrder(
        { ...validDto, note: 'Table 5' } as any,
        'ip',
        'ua',
      );

      expect(result.message).toContain('Table 5');
    });

    it('should persist an analytics event after order creation', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.analyticsEvent.create.mockResolvedValue({});

      await service.createOrder(validDto as any, '1.2.3.4', 'ua');

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ event_type: 'WHATSAPP_CLICK' }),
        }),
      );
    });

    it('should not fail if analytics event creation throws', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.analyticsEvent.create.mockRejectedValue(new Error('Analytics DB down'));

      // Should still succeed despite analytics failure
      await expect(service.createOrder(validDto as any, 'ip', 'ua')).resolves.toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────
  // buildWhatsAppMessage
  // ──────────────────────────────────────────────────
  describe('buildWhatsAppMessage()', () => {
    it('should include order ID, items and total', () => {
      const message = service.buildWhatsAppMessage('ZO-ABC123', mockItems);
      expect(message).toContain('#ZO-ABC123');
      expect(message).toContain('Poulet braisé');
      expect(message).toContain('Jus de gingembre');
      expect(message).toContain('8 000'); // 3500*2 + 1000*1 = 8000
    });

    it('should include note when provided', () => {
      const message = service.buildWhatsAppMessage('ZO-ABC123', mockItems, 'Table 7');
      expect(message).toContain('Table 7');
    });

    it('should not include note section when note is undefined', () => {
      const message = service.buildWhatsAppMessage('ZO-ABC123', mockItems);
      expect(message).not.toContain('Note');
    });
  });

  // ──────────────────────────────────────────────────
  // getOrderStats
  // ──────────────────────────────────────────────────
  describe('getOrderStats()', () => {
    it('should return stats aggregates', async () => {
      mockPrisma.order.count.mockResolvedValue(42);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total_amount: 150000 } });
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.getOrderStats('resto-abc');

      expect(result.total_orders).toBe(42);
      expect(result.potential_revenue).toBe(150000);
      expect(result.recent_orders).toHaveLength(1);
    });

    it('should return 0 when no orders exist', async () => {
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total_amount: null } });
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.getOrderStats('resto-abc');

      expect(result.total_orders).toBe(0);
      expect(result.potential_revenue).toBe(0);
    });
  });
});
