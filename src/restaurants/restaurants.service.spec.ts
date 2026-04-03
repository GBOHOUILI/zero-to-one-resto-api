import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../common/redis/redis.service';
import { DomainValidationService } from '../tenants/domain-validation.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRestaurant = {
  id: 'resto-123',
  name: 'Le Bon Goût',
  slug: 'le-bon-gout',
  status: 'active',
  owner_id: 'user-123',
  created_at: new Date(),
};

const makeTenantClient = () => ({
  restaurant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  openingHour: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  socialLink: {
    upsert: jest.fn(),
  },
  customDomain: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
});

const mockPrisma: any = {
  restaurant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  profile: {
    create: jest.fn(),
  },
  openingHour: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  socialLink: { upsert: jest.fn() },
  customDomain: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  pageConfig: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  withTenant: jest.fn(() => makeTenantClient()),
  $transaction: jest.fn((arr) => Promise.all(arr)),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockMail = {
  sendResetPasswordEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
};

const mockDomainValidator = {
  validateConfig: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
        { provide: RedisService, useValue: mockRedis },
        { provide: DomainValidationService, useValue: mockDomainValidator },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────
  // getAll
  // ──────────────────────────────────────────────────
  describe('getAll()', () => {
    it('should return all restaurants for SUPER_ADMIN', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([mockRestaurant]);
      const result = await service.getAll('SUPER_ADMIN');
      expect(result).toEqual([mockRestaurant]);
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalled();
    });

    it('should use tenant client for RESTO_ADMIN', async () => {
      const tenantClient = makeTenantClient();
      tenantClient.restaurant.findMany.mockResolvedValue([mockRestaurant]);
      mockPrisma.withTenant.mockReturnValue(tenantClient);

      const result = await service.getAll('RESTO_ADMIN', 'resto-123');

      expect(mockPrisma.withTenant).toHaveBeenCalledWith('resto-123');
      expect(result).toEqual([mockRestaurant]);
    });
  });

  // ──────────────────────────────────────────────────
  // getById
  // ──────────────────────────────────────────────────
  describe('getById()', () => {
    it('should return a restaurant by id', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
      const result = await service.getById('resto-123');
      expect(result).toEqual(mockRestaurant);
    });

    it('should throw NotFoundException if restaurant does not exist', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────────────
  // updateSocialLinks
  // ──────────────────────────────────────────────────
  describe('updateSocialLinks()', () => {
    it('should use prisma directly for SUPER_ADMIN', async () => {
      mockPrisma.socialLink.upsert.mockResolvedValue({
        facebook: 'https://fb.com/test',
      });
      const dto = { facebook: 'https://fb.com/test' };

      await service.updateSocialLinks('resto-123', dto as any, 'SUPER_ADMIN');

      expect(mockPrisma.socialLink.upsert).toHaveBeenCalled();
    });

    it('should use tenant client for RESTO_ADMIN', async () => {
      const tenantClient = makeTenantClient();
      tenantClient.socialLink.upsert.mockResolvedValue({});
      mockPrisma.withTenant.mockReturnValue(tenantClient);

      await service.updateSocialLinks('resto-123', {} as any, 'RESTO_ADMIN');

      expect(mockPrisma.withTenant).toHaveBeenCalledWith('resto-123');
    });
  });

  // ──────────────────────────────────────────────────
  // addCustomDomain
  // ──────────────────────────────────────────────────
  describe('addCustomDomain()', () => {
    it('should create custom domain when DNS is valid and domain is unique', async () => {
      mockDomainValidator.validateConfig.mockResolvedValue(true);
      mockPrisma.customDomain.findUnique.mockResolvedValue(null);
      mockPrisma.customDomain.create.mockResolvedValue({
        id: 'domain-1',
        hostname: 'resto.com',
        restaurantId: 'resto-123',
      });
      mockRedis.set.mockResolvedValue(undefined);

      const result = await service.addCustomDomain('resto-123', {
        hostname: 'Resto.Com',
        isPrimary: false,
      });

      expect(mockDomainValidator.validateConfig).toHaveBeenCalledWith(
        'resto.com',
      );
      expect(result.hostname).toBe('resto.com');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'tenant:resto.com',
        'resto-123',
        3600,
      );
    });

    it('should throw BadRequestException if DNS validation fails', async () => {
      mockDomainValidator.validateConfig.mockResolvedValue(false);

      await expect(
        service.addCustomDomain('resto-123', {
          hostname: 'bad.com',
          isPrimary: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if domain already used', async () => {
      mockDomainValidator.validateConfig.mockResolvedValue(true);
      mockPrisma.customDomain.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.addCustomDomain('resto-123', {
          hostname: 'taken.com',
          isPrimary: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────────────
  // removeCustomDomain
  // ──────────────────────────────────────────────────
  describe('removeCustomDomain()', () => {
    it('should delete custom domain by id', async () => {
      mockPrisma.customDomain.delete.mockResolvedValue({ id: 'domain-1' });

      const result = await service.removeCustomDomain('domain-1');
      expect(mockPrisma.customDomain.delete).toHaveBeenCalledWith({
        where: { id: 'domain-1' },
      });
    });

    it('should throw NotFoundException if domain not found', async () => {
      mockPrisma.customDomain.delete.mockRejectedValue(new Error('Not found'));

      await expect(service.removeCustomDomain('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────────────
  // updateDesign
  // ──────────────────────────────────────────────────
  describe('updateDesign()', () => {
    it('should update design and return design fields', async () => {
      const designResult = {
        primary_color: '#FF0000',
        secondary_color: '#000000',
        font_family: 'Inter',
        template: 'default',
        dark_mode: false,
      };
      mockPrisma.restaurant.update.mockResolvedValue(designResult);

      const result = await service.updateDesign(
        'resto-123',
        { primary_color: '#FF0000' } as any,
        'SUPER_ADMIN',
        'resto-123',
      );

      expect(result).toEqual(designResult);
    });

    it('should throw ForbiddenException when RESTO_ADMIN tries to update another tenant design', async () => {
      const tenantClient = makeTenantClient();
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not found',
        { code: 'P2025', clientVersion: '5' },
      );
      tenantClient.restaurant.update.mockRejectedValue(prismaError);
      mockPrisma.withTenant.mockReturnValue(tenantClient);

      await expect(
        service.updateDesign(
          'other-resto',
          {} as any,
          'RESTO_ADMIN',
          'my-resto',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── PATCH : ajouter ces blocs describe() dans restaurants.service.spec.ts ──
  // Colle ces blocs AVANT la dernière accolade fermante de describe('RestaurantsService', ...)

  // ──────────────────────────────────────────────────
  // updateOpeningHours
  // ──────────────────────────────────────────────────
  describe('updateOpeningHours()', () => {
    const validHours = [
      {
        day_of_week: 1,
        open_time: '08:00',
        close_time: '22:00',
        is_closed: false,
      },
      {
        day_of_week: 2,
        open_time: '08:00',
        close_time: '22:00',
        is_closed: false,
      },
    ];

    it('should replace all hours for SUPER_ADMIN via $transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          openingHour: {
            deleteMany: jest.fn().mockResolvedValue({}),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        }),
      );

      const result = await service.updateOpeningHours(
        'resto-123',
        validHours as any,
        'SUPER_ADMIN',
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should use tenant client for RESTO_ADMIN', async () => {
      const tenantClient = makeTenantClient();
      tenantClient.openingHour.deleteMany.mockResolvedValue({});
      tenantClient.openingHour.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.withTenant.mockReturnValue(tenantClient);

      await service.updateOpeningHours(
        'resto-123',
        validHours as any,
        'RESTO_ADMIN',
      );

      expect(mockPrisma.withTenant).toHaveBeenCalledWith('resto-123');
      expect(tenantClient.openingHour.deleteMany).toHaveBeenCalled();
      expect(tenantClient.openingHour.createMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException when close_time <= open_time', async () => {
      const invalidHours = [
        {
          day_of_week: 1,
          open_time: '22:00',
          close_time: '08:00',
          is_closed: false,
        },
      ];

      await expect(
        service.updateOpeningHours(
          'resto-123',
          invalidHours as any,
          'SUPER_ADMIN',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip time validation for closed days', async () => {
      const closedDay = [
        {
          day_of_week: 0,
          open_time: '00:00',
          close_time: '00:00',
          is_closed: true,
        },
      ];

      const tenantClient = makeTenantClient();
      tenantClient.openingHour.deleteMany.mockResolvedValue({});
      tenantClient.openingHour.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.withTenant.mockReturnValue(tenantClient);

      // Ne doit PAS lancer d'exception même si open_time >= close_time
      await expect(
        service.updateOpeningHours(
          'resto-123',
          closedDay as any,
          'RESTO_ADMIN',
        ),
      ).resolves.not.toThrow();
    });
  });

  // ──────────────────────────────────────────────────
  // updateContact
  // ──────────────────────────────────────────────────
  describe('updateContact()', () => {
    it('should upsert contact with valid WhatsApp number', async () => {
      const tenantClient = makeTenantClient() as any;
      tenantClient.contact = {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      };
      mockPrisma.withTenant.mockReturnValue(tenantClient);

      const dto = { whatsapp: '+22961000001', phone: '+22921000001' };
      await service.updateContact('resto-123', dto as any, 'RESTO_ADMIN');

      expect(tenantClient.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ whatsapp: '+22961000001' }),
        }),
      );
    });

    it('should throw BadRequestException when creating contact without WhatsApp', async () => {
      const tenantClient = makeTenantClient() as any;
      tenantClient.contact = {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      };
      mockPrisma.withTenant.mockReturnValue(tenantClient);

      // Pas de whatsapp sur une création
      await expect(
        service.updateContact(
          'resto-123',
          { phone: '+22921000001' } as any,
          'RESTO_ADMIN',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────────────
  // updateStatus
  // ──────────────────────────────────────────────────
  describe('updateStatus()', () => {
    it('should update restaurant status to suspended', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({
        ...mockRestaurant,
        status: 'suspended',
      });

      const result = await service.updateStatus('resto-123', 'suspended');

      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'resto-123' },
        data: { status: 'suspended' },
      });
    });

    it('should throw NotFoundException if restaurant not found', async () => {
      mockPrisma.restaurant.update.mockRejectedValue(new Error('Not found'));

      await expect(
        service.updateStatus('nonexistent', 'active'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // hardDelete
  // ──────────────────────────────────────────────────
  describe('hardDelete()', () => {
    it('should delete restaurant and its owner user in transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          restaurant: {
            findUnique: jest.fn().mockResolvedValue(mockRestaurant),
            delete: jest.fn().mockResolvedValue(mockRestaurant),
          },
          user: {
            delete: jest.fn().mockResolvedValue({}),
          },
        }),
      );

      const result = await service.hardDelete('resto-123');
      expect(result.message).toContain('supprimés');
    });

    it('should throw NotFoundException if restaurant not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          restaurant: {
            findUnique: jest.fn().mockResolvedValue(null),
            delete: jest.fn(),
          },
          user: { delete: jest.fn() },
        }),
      );

      await expect(service.hardDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────────────
  // delete (soft delete par slug)
  // ──────────────────────────────────────────────────
  describe('delete()', () => {
    it('should allow SUPER_ADMIN to soft-delete by slug', async () => {
      mockPrisma.restaurant.delete.mockResolvedValue(mockRestaurant);

      const result = await service.delete('le-bon-gout', 'SUPER_ADMIN');
      expect(mockPrisma.restaurant.delete).toHaveBeenCalledWith({
        where: { slug: 'le-bon-gout' },
      });
    });

    it('should throw ForbiddenException if not SUPER_ADMIN', async () => {
      await expect(
        service.delete('le-bon-gout', 'RESTO_ADMIN'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for unknown slug', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5' },
      );
      mockPrisma.restaurant.delete.mockRejectedValue(prismaError);

      await expect(
        service.delete('nonexistent-slug', 'SUPER_ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
