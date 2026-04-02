import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { TenantService } from '../tenants/tenant.service';
import { MailService } from '../mail/mail.service';
import { NotFoundException } from '@nestjs/common';

const mockRestaurantsService = {
  getById: jest.fn(),
};

const mockTenantService = {
  resolveTenant: jest.fn(),
};

const mockMailService = {
  sendWelcomeEmail: jest.fn(),
};

describe('RestaurantsController', () => {
  let controller: RestaurantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantsController],
      providers: [
        { provide: RestaurantsService, useValue: mockRestaurantsService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    controller = module.get<RestaurantsController>(RestaurantsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPublic()', () => {
    const fakeReq = { headers: { host: 'monresto.zero-to-one.bj' } };

    it('should resolve tenant and return restaurant public data', async () => {
      mockTenantService.resolveTenant.mockResolvedValue('resto-123');
      mockRestaurantsService.getById.mockResolvedValue({
        id: 'resto-123',
        name: 'Mon Resto',
        slug: 'monresto',
      });

      const result = await controller.getPublic(fakeReq);

      expect(mockTenantService.resolveTenant).toHaveBeenCalledWith(
        'monresto.zero-to-one.bj',
      );
      expect(mockRestaurantsService.getById).toHaveBeenCalledWith(
        'resto-123',
        'SUPER_ADMIN',
        'resto-123',
      );
      expect(result.name).toBe('Mon Resto');
    });

    it('should throw NotFoundException when no tenant for this host', async () => {
      mockTenantService.resolveTenant.mockResolvedValue(null);

      await expect(controller.getPublic(fakeReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
