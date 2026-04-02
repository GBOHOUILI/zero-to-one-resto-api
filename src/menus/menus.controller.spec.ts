import { Test, TestingModule } from '@nestjs/testing';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { TenantService } from '../tenants/tenant.service';
import { NotFoundException } from '@nestjs/common';

const mockMenusService = {
  getPublicMenu: jest.fn(),
};

const mockTenantService = {
  resolveTenant: jest.fn(),
};

describe('MenusController', () => {
  let controller: MenusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenusController],
      providers: [
        { provide: MenusService, useValue: mockMenusService },
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    controller = module.get<MenusController>(MenusController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPublicMenu()', () => {
    const fakeReq = { headers: { host: 'pizzeria.zero-to-one.bj' } };

    it('should resolve tenant from host and return menu', async () => {
      mockTenantService.resolveTenant.mockResolvedValue('resto-123');
      mockMenusService.getPublicMenu.mockResolvedValue([
        { id: 'cat-1', name: 'Entrées', menu_items: [] },
      ]);

      const result = await controller.getPublicMenu(fakeReq);

      expect(mockTenantService.resolveTenant).toHaveBeenCalledWith(
        'pizzeria.zero-to-one.bj',
      );
      expect(mockMenusService.getPublicMenu).toHaveBeenCalledWith('resto-123');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when tenant cannot be resolved', async () => {
      mockTenantService.resolveTenant.mockResolvedValue(null);

      await expect(controller.getPublicMenu(fakeReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
