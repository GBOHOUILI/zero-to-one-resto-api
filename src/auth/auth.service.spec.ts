import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from './role.enum';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
  role: Role.RESTO_ADMIN,
  refresh_token: null,
  reset_token: null,
  reset_token_expiry: null,
  profile: { restaurantId: 'resto-456' },
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  profile: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockMailService = {
  sendResetPasswordEmail: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    const validEmail = 'new@example.com';
    const validPassword = 'StrongPass1';

    it('should register a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: validEmail,
        role: Role.RESTO_ADMIN,
        profile: null,
      });
      mockPrismaService.profile.create.mockResolvedValue({});

      const result = await service.register(
        validEmail,
        validPassword,
        Role.RESTO_ADMIN,
      );

      expect(result.message).toBe('Utilisateur créé avec succès');
      expect(result.role).toBe(Role.RESTO_ADMIN);
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });

    it('should reject password shorter than 8 chars', async () => {
      await expect(
        service.register(validEmail, 'Short1', Role.RESTO_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject password without uppercase letter', async () => {
      await expect(
        service.register(validEmail, 'weakpass1', Role.RESTO_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject password without digit', async () => {
      await expect(
        service.register(validEmail, 'WeakPassWord', Role.RESTO_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.register(validEmail, validPassword, Role.RESTO_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash the password before saving', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: validEmail,
        role: Role.RESTO_ADMIN,
        profile: null,
      });
      mockPrismaService.profile.create.mockResolvedValue({});

      await service.register(validEmail, validPassword, Role.RESTO_ADMIN);

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe(validPassword);
      expect(createCall.data.password).toMatch(/^\$2b\$/);
    });

    it('should link restaurantId to profile when provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: validEmail,
        role: Role.RESTO_ADMIN,
        profile: null,
      });
      mockPrismaService.profile.create.mockResolvedValue({});

      const result = await service.register(
        validEmail,
        validPassword,
        Role.RESTO_ADMIN,
        'resto-456',
      );

      expect(result.restaurantId).toBe('resto-456');
    });
  });

  describe('login()', () => {
    it('should return tokens and user data on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('StrongPass1', 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.login('test@example.com', 'StrongPass1');

      expect(result.access_token).toBe('access_token_mock');
      expect(result.refresh_token).toBe('refresh_token_mock');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login('nobody@example.com', 'AnyPassword1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPass1', 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      await expect(
        service.login('test@example.com', 'WrongPassword1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should use same error message for both wrong email and wrong password (anti-enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      let errorForMissingUser: string | undefined;
      try {
        await service.login('nobody@example.com', 'AnyPassword1');
      } catch (e) {
        errorForMissingUser = e.message;
      }

      const hashedPassword = await bcrypt.hash('RealPass1', 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      let errorForWrongPassword: string | undefined;
      try {
        await service.login('test@example.com', 'WrongPassword1');
      } catch (e) {
        errorForWrongPassword = e.message;
      }

      expect(errorForMissingUser).toBe(errorForWrongPassword);
    });
  });

  describe('forgotPassword()', () => {
    it('should return generic message if user does not exist (anti-enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.forgotPassword('unknown@example.com');
      expect(result.message).toBe('Si cet email existe, un lien a été envoyé.');
      expect(mockMailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should save reset token and send email if user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});
      mockMailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toBe('Si cet email existe, un lien a été envoyé.');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reset_token: expect.any(String),
            reset_token_expiry: expect.any(Date),
          }),
        }),
      );
      expect(mockMailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('should set expiry 1 hour in the future', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});
      mockMailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      const before = Date.now();
      await service.forgotPassword('test@example.com');

      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      const expiry: Date = updateCall.data.reset_token_expiry;
      expect(expiry.getTime()).toBeGreaterThan(before + 3599 * 1000);
    });
  });

  describe('resetPassword()', () => {
    it('should update password and clear reset token on valid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.resetPassword('valid-token', 'NewPass123');

      expect(result.message).toBe('Mot de passe mis à jour avec succès.');
      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      expect(updateCall.data.reset_token).toBeNull();
      expect(updateCall.data.reset_token_expiry).toBeNull();
      expect(updateCall.data.refresh_token).toBeNull();
    });

    it('should throw UnauthorizedException for invalid or expired token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(
        service.resetPassword('invalid-token', 'NewPass123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should validate new password strength on reset', async () => {
      await expect(
        service.resetPassword('valid-token', 'weakpass'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshTokens()', () => {
    it('should return new tokens if refresh token matches', async () => {
      const rt = 'raw_refresh_token';
      const hashedRt = await bcrypt.hash(rt, 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refresh_token: hashedRt,
      });
      mockPrismaService.profile.findUnique.mockResolvedValue({
        restaurantId: 'resto-456',
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access')
        .mockResolvedValueOnce('new_refresh');
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.refreshTokens('user-123', rt);

      expect(result.access_token).toBe('new_access');
      expect(result.refresh_token).toBe('new_refresh');
    });

    it('should throw ForbiddenException if no refresh token stored', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refresh_token: null,
      });
      await expect(
        service.refreshTokens('user-123', 'some_rt'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if refresh token does not match', async () => {
      const hashedRt = await bcrypt.hash('correct_token', 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refresh_token: hashedRt,
      });
      await expect(
        service.refreshTokens('user-123', 'wrong_token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.refreshTokens('nonexistent-id', 'some_rt'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout()', () => {
    it('should null the refresh token in database', async () => {
      mockPrismaService.user.update.mockResolvedValue({});
      const result = await service.logout('user-123');
      expect(result.message).toBe('Déconnexion réussie');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { refresh_token: null },
      });
    });
  });
});
