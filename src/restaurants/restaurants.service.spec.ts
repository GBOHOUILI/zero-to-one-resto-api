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
});
