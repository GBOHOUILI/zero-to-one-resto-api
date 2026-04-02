import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { UploadService } from '../common/upload.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const RESTAURANT_ID = 'resto-abc';

const mockCategory = {
  id: 'cat-1',
  restaurant_id: RESTAURANT_ID,
  name: 'Entrées',
  position: 0,
  icon: null,
  menu_items: [],
};

const mockItem = {
  id: 'item-1',
  restaurant_id: RESTAURANT_ID,
  category_id: 'cat-1',
  name: 'Poulet braisé',
  price: 3500,
  available: true,
  image_url: 'https://res.cloudinary.com/demo/image/upload/v1/item-1.jpg',
  position: 0,
};

// Tenant client factory — simule prisma.withTenant(id)
const makeTenantClient = () => ({
  menuCategory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  menuItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
});

const mockPrisma: any = {
  withTenant: jest.fn(),
  $transaction: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockUploadService = {
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
};

// ─── Suite ─────────────────────────────────────────────────────────────────────

describe('MenusService', () => {
  let service: MenusService;
  let tenantClient: ReturnType<typeof makeTenantClient>;

  beforeEach(async () => {
    tenantClient = makeTenantClient();
    mockPrisma.withTenant.mockReturnValue(tenantClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
    jest.clearAllMocks();
    // Restore mock after clear
    mockPrisma.withTenant.mockReturnValue(tenantClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────
  // getPublicMenu
  // ──────────────────────────────────────────────────
  describe('getPublicMenu()', () => {
    it('should return cached menu if Redis hit', async () => {
      const cached = JSON.stringify([mockCategory]);
      mockRedis.get.mockResolvedValue(cached);

      const result = await service.getPublicMenu(RESTAURANT_ID);

      expect(mockRedis.get).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
      expect(result).toEqual([mockCategory]);
      expect(tenantClient.menuCategory.findMany).not.toHaveBeenCalled();
    });

    it('should query DB on cache miss and store in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);
      tenantClient.menuCategory.findMany.mockResolvedValue([mockCategory]);
      mockRedis.set.mockResolvedValue(undefined);

      const result = await service.getPublicMenu(RESTAURANT_ID);

      expect(tenantClient.menuCategory.findMany).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
        JSON.stringify([mockCategory]),
        3600,
      );
      expect(result).toEqual([mockCategory]);
    });

    it('should throw NotFoundException when menu is empty', async () => {
      mockRedis.get.mockResolvedValue(null);
      tenantClient.menuCategory.findMany.mockResolvedValue([]);

      await expect(service.getPublicMenu(RESTAURANT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────────────
  // createCategory
  // ──────────────────────────────────────────────────
  describe('createCategory()', () => {
    it('should create a category with auto-position when none provided', async () => {
      tenantClient.menuCategory.findFirst.mockResolvedValue({ position: 2 });
      tenantClient.menuCategory.create.mockResolvedValue({
        ...mockCategory,
        position: 3,
      });
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.createCategory(RESTAURANT_ID, {
        name: 'Plats',
      } as any);

      expect(tenantClient.menuCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 3,
            restaurant_id: RESTAURANT_ID,
          }),
        }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
    });

    it('should use position 0 when no previous category exists', async () => {
      tenantClient.menuCategory.findFirst.mockResolvedValue(null);
      tenantClient.menuCategory.create.mockResolvedValue({
        ...mockCategory,
        position: 0,
      });
      mockRedis.del.mockResolvedValue(undefined);

      await service.createCategory(RESTAURANT_ID, { name: 'Entrées' } as any);

      const createCall = tenantClient.menuCategory.create.mock.calls[0][0];
      expect(createCall.data.position).toBe(0);
    });

    it('should use provided position when explicitly set', async () => {
      tenantClient.menuCategory.create.mockResolvedValue({
        ...mockCategory,
        position: 5,
      });
      mockRedis.del.mockResolvedValue(undefined);

      await service.createCategory(RESTAURANT_ID, {
        name: 'Boissons',
        position: 5,
      } as any);

      const createCall = tenantClient.menuCategory.create.mock.calls[0][0];
      expect(createCall.data.position).toBe(5);
    });

    it('should invalidate Redis cache after creation', async () => {
      tenantClient.menuCategory.findFirst.mockResolvedValue(null);
      tenantClient.menuCategory.create.mockResolvedValue(mockCategory);
      mockRedis.del.mockResolvedValue(undefined);

      await service.createCategory(RESTAURANT_ID, { name: 'Test' } as any);

      expect(mockRedis.del).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
    });
  });

  // ──────────────────────────────────────────────────
  // updateCategory
  // ──────────────────────────────────────────────────
  describe('updateCategory()', () => {
    it('should update a category and invalidate cache', async () => {
      const updated = { ...mockCategory, name: 'Plats Chauds' };
      tenantClient.menuCategory.update.mockResolvedValue(updated);
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.updateCategory('cat-1', RESTAURANT_ID, {
        name: 'Plats Chauds',
      } as any);

      expect(result.name).toBe('Plats Chauds');
      expect(mockRedis.del).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
    });

    it('should throw NotFoundException if category does not exist (P2025)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5',
        },
      );
      tenantClient.menuCategory.update.mockRejectedValue(prismaError);

      await expect(
        service.updateCategory('nonexistent', RESTAURANT_ID, {
          name: 'X',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // deleteCategory
  // ──────────────────────────────────────────────────
  describe('deleteCategory()', () => {
    it('should delete an empty category', async () => {
      tenantClient.menuCategory.findUnique.mockResolvedValue({
        ...mockCategory,
        _count: { menu_items: 0 },
      });
      tenantClient.menuCategory.delete.mockResolvedValue(mockCategory);
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.deleteCategory('cat-1', RESTAURANT_ID);

      expect(tenantClient.menuCategory.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
    });

    it('should throw ForbiddenException when category has items', async () => {
      tenantClient.menuCategory.findUnique.mockResolvedValue({
        ...mockCategory,
        _count: { menu_items: 3 },
      });

      await expect(
        service.deleteCategory('cat-1', RESTAURANT_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      tenantClient.menuCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteCategory('nonexistent', RESTAURANT_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // createItem
  // ──────────────────────────────────────────────────
  describe('createItem()', () => {
    const dto = {
      name: 'Poulet braisé',
      price: 3500,
      category_id: 'cat-1',
    };

    it('should create a menu item without image', async () => {
      tenantClient.menuCategory.findUnique.mockResolvedValue(mockCategory);
      tenantClient.menuItem.findFirst.mockResolvedValue(null);
      tenantClient.menuItem.create.mockResolvedValue({
        ...mockItem,
        image_url: null,
      });
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.createItem(RESTAURANT_ID, dto as any);

      expect(result.name).toBe('Poulet braisé');
      expect(mockUploadService.uploadImage).not.toHaveBeenCalled();
    });

    it('should upload image and store URL when file is provided', async () => {
      tenantClient.menuCategory.findUnique.mockResolvedValue(mockCategory);
      tenantClient.menuItem.findFirst.mockResolvedValue(null);
      mockUploadService.uploadImage.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/demo/uploaded.jpg',
      });
      tenantClient.menuItem.create.mockResolvedValue({
        ...mockItem,
        image_url: 'https://res.cloudinary.com/demo/uploaded.jpg',
      });
      mockRedis.del.mockResolvedValue(undefined);

      const fakeFile = {
        buffer: Buffer.from('img'),
        mimetype: 'image/jpeg',
      } as any;
      const result = await service.createItem(
        RESTAURANT_ID,
        dto as any,
        fakeFile,
      );

      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(
        fakeFile,
        RESTAURANT_ID,
      );
      expect(result.image_url).toBe(
        'https://res.cloudinary.com/demo/uploaded.jpg',
      );
    });

    it('should throw NotFoundException when category does not exist', async () => {
      tenantClient.menuCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.createItem(RESTAURANT_ID, dto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when image upload fails', async () => {
      tenantClient.menuCategory.findUnique.mockResolvedValue(mockCategory);
      tenantClient.menuItem.findFirst.mockResolvedValue(null);
      mockUploadService.uploadImage.mockRejectedValue(
        new Error('Cloudinary error'),
      );

      const fakeFile = {
        buffer: Buffer.from('img'),
        mimetype: 'image/jpeg',
      } as any;
      await expect(
        service.createItem(RESTAURANT_ID, dto as any, fakeFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────────────
  // deleteItem
  // ──────────────────────────────────────────────────
  describe('deleteItem()', () => {
    it('should delete item and remove its Cloudinary image', async () => {
      tenantClient.menuItem.findUnique.mockResolvedValue(mockItem);
      mockUploadService.deleteImage.mockResolvedValue(undefined);
      tenantClient.menuItem.delete.mockResolvedValue(mockItem);
      mockRedis.del.mockResolvedValue(undefined);

      await service.deleteItem('item-1', RESTAURANT_ID);

      expect(mockUploadService.deleteImage).toHaveBeenCalledWith(
        mockItem.image_url,
      );
      expect(tenantClient.menuItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
    });

    it('should delete item without image silently', async () => {
      tenantClient.menuItem.findUnique.mockResolvedValue({
        ...mockItem,
        image_url: null,
      });
      tenantClient.menuItem.delete.mockResolvedValue({
        ...mockItem,
        image_url: null,
      });
      mockRedis.del.mockResolvedValue(undefined);

      await service.deleteItem('item-1', RESTAURANT_ID);

      expect(mockUploadService.deleteImage).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when item does not exist', async () => {
      tenantClient.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteItem('nonexistent', RESTAURANT_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // toggleItemAvailability
  // ──────────────────────────────────────────────────
  describe('toggleItemAvailability()', () => {
    it('should set item available=true and invalidate cache', async () => {
      tenantClient.menuItem.update.mockResolvedValue({
        ...mockItem,
        available: true,
      });
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.toggleItemAvailability(
        'item-1',
        RESTAURANT_ID,
        true,
      );

      expect(tenantClient.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { available: true },
      });
      expect(mockRedis.del).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
    });

    it('should set item available=false (mark as sold out)', async () => {
      tenantClient.menuItem.update.mockResolvedValue({
        ...mockItem,
        available: false,
      });
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.toggleItemAvailability(
        'item-1',
        RESTAURANT_ID,
        false,
      );

      expect(result.available).toBe(false);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      tenantClient.menuItem.update.mockRejectedValue(new Error('Not found'));

      await expect(
        service.toggleItemAvailability('nonexistent', RESTAURANT_ID, true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // reorderCategories
  // ──────────────────────────────────────────────────
  describe('reorderCategories()', () => {
    it('should update positions in a transaction and invalidate cache', async () => {
      const updates = [
        { id: 'cat-1', position: 1 },
        { id: 'cat-2', position: 0 },
      ];

      // $transaction receives an array of promises — mock it
      tenantClient.menuCategory.update.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((arr: any[]) =>
        Promise.all(arr),
      );
      mockRedis.del.mockResolvedValue(undefined);

      await service.reorderCategories(RESTAURANT_ID, {
        categories: updates,
      } as any);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith(
        `menu:public:${RESTAURANT_ID}`,
      );
    });
  });
});
