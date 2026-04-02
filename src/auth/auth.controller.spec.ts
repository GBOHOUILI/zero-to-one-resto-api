import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from './role.enum';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  logout: jest.fn(),
  refreshTokens: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register()', () => {
    it('should call authService.register with correct params', async () => {
      const dto = {
        email: 'new@test.com',
        password: 'StrongPass1',
        role: Role.RESTO_ADMIN,
      };
      const expected = {
        message: 'Utilisateur créé avec succès',
        userId: 'uid-1',
        role: Role.RESTO_ADMIN,
        restaurantId: null,
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        dto.email,
        dto.password,
        dto.role,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('login()', () => {
    it('should call authService.login and return tokens', async () => {
      const dto = { email: 'user@test.com', password: 'Pass1' };
      const expected = {
        access_token: 'at',
        refresh_token: 'rt',
        user: { id: '1', email: 'user@test.com' },
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('forgotPassword()', () => {
    it('should call forgotPassword with email', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'Si cet email existe, un lien a été envoyé.',
      });
      const result = await controller.forgotPassword({
        email: 'user@test.com',
      });
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        'user@test.com',
      );
      expect(result.message).toContain('Si cet email existe');
    });
  });

  describe('resetPassword()', () => {
    it('should call resetPassword with token and newPassword', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Mot de passe mis à jour avec succès.',
      });
      const result = await controller.resetPassword({
        token: 'abc',
        newPassword: 'NewPass123',
      });
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'abc',
        'NewPass123',
      );
      expect(result.message).toContain('succès');
    });
  });

  describe('logout()', () => {
    it('should call logout with userId from JWT', async () => {
      mockAuthService.logout.mockResolvedValue({
        message: 'Déconnexion réussie',
      });
      const result = await controller.logout('user-123');
      expect(mockAuthService.logout).toHaveBeenCalledWith('user-123');
      expect(result.message).toContain('Déconnexion');
    });
  });

  describe('refreshTokens()', () => {
    it('should call refreshTokens with userId and refreshToken', async () => {
      mockAuthService.refreshTokens.mockResolvedValue({
        access_token: 'new_at',
        refresh_token: 'new_rt',
      });
      const result = await controller.refreshTokens('user-123', 'raw_rt');
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        'user-123',
        'raw_rt',
      );
      expect(result.access_token).toBe('new_at');
    });
  });

  describe('getMe()', () => {
    it('should return the user from JWT payload', () => {
      const fakeUser = {
        id: 'user-123',
        email: 'me@test.com',
        role: Role.RESTO_ADMIN,
      };
      const result = controller.getMe(fakeUser);
      expect(result).toEqual(fakeUser);
    });
  });
});
