// tests/unit/services/auth/auth.service.test.ts
import { authService } from '../../../../src/services';
import { prismaService, redisService } from '../../../../src/db';
import { tokenService } from '../../../../src/services';
import { NotFoundError, UnauthorizedError } from '../../../../src/lib/exceptions';
import { safe } from '../../../../src/lib/utils/safe.utils';
import argon2 from 'argon2';

jest.mock('../../../src/db');
jest.mock('../../../src/services/auth/tokens.service');
jest.mock('argon2');

describe('AuthService', () => {
  let mockPrisma: any;
  let mockRedis: any;
  let mockUser: any;
  let mockUserPassword: any;

  beforeEach(() => {
    mockUser = {
      id: BigInt(1),
      email: 'test@example.com',
      created_at: new Date(),
    };

    mockUserPassword = {
      user_id: BigInt(1),
      password: 'hashed-password',
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      userPassword: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockRedis = {
      get: jest.fn(),
      del: jest.fn(),
    };

    (prismaService.getClient as jest.Mock).mockReturnValue(mockPrisma);
    (redisService.getClient as jest.Mock).mockReturnValue(mockRedis);
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.authenticateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        authService.authenticateUser('nonexistent@example.com', 'password123')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Invalid credentials');
    });

    it('should throw error if user password not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPassword.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        authService.authenticateUser('test@example.com', 'password123')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Invalid credentials');
    });

    it('should throw error if password is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPassword.findUnique.mockResolvedValue({
        ...mockUserPassword,
        password: null,
      });

      const [result, error] = await safe(
        authService.authenticateUser('test@example.com', 'password123')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const [result, error] = await safe(
        authService.authenticateUser('test@example.com', 'wrongpassword')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Invalid credentials');
    });

    it('should verify password with correct hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await authService.authenticateUser('test@example.com', 'password123');

      expect(argon2.verify).toHaveBeenCalledWith(mockUserPassword.password, 'password123');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await authService.changePassword(BigInt(1), 'oldpassword', 'newpassword');

      expect(mockPrisma.userPassword.update).toHaveBeenCalledWith({
        where: { user_id: BigInt(1) },
        data: { password: 'new-hashed-password' },
      });
    });

    it('should throw error if user password not found', async () => {
      mockPrisma.userPassword.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        authService.changePassword(BigInt(1), 'oldpassword', 'newpassword')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Wrong user authentication method');
    });

    it('should throw error if password is null', async () => {
      mockPrisma.userPassword.findUnique.mockResolvedValue({
        ...mockUserPassword,
        password: null,
      });

      const [result, error] = await safe(
        authService.changePassword(BigInt(1), 'oldpassword', 'newpassword')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if old password does not match', async () => {
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const [result, error] = await safe(
        authService.changePassword(BigInt(1), 'wrongpassword', 'newpassword')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Wrong password');
    });

    it('should hash new password with argon2', async () => {
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await authService.changePassword(BigInt(1), 'oldpassword', 'newpassword');

      expect(argon2.hash).toHaveBeenCalledWith('newpassword', {
        type: argon2.argon2id,
      });
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should reset password with valid token', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue({ userId: BigInt(1) });
      mockRedis.get.mockResolvedValue('hashed-reset-token');
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await authService.resetPasswordWithToken('newpassword', 'reset-token');

      expect(mockPrisma.userPassword.update).toHaveBeenCalledWith({
        where: { user_id: BigInt(1) },
        data: { password: 'new-hashed-password' },
      });
    });

    it('should delete reset token from Redis after successful reset', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue({ userId: BigInt(1) });
      mockRedis.get.mockResolvedValue('hashed-reset-token');
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await authService.resetPasswordWithToken('newpassword', 'reset-token');

      expect(mockRedis.del).toHaveBeenCalledWith('reset:1');
    });

    it('should throw error if token is invalid', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue(null);

      const [result, error] = await safe(
        authService.resetPasswordWithToken('newpassword', 'invalid-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Invalid or expired token');
    });

    it('should throw error if token is string', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue('string-token');

      const [result, error] = await safe(
        authService.resetPasswordWithToken('newpassword', 'reset-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if userId not in token', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue({ email: 'test@example.com' });

      const [result, error] = await safe(
        authService.resetPasswordWithToken('newpassword', 'reset-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if no saved reset token found', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue({ userId: BigInt(1) });
      mockRedis.get.mockResolvedValue(null);

      const [result, error] = await safe(
        authService.resetPasswordWithToken('newpassword', 'reset-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Invalid or expired token');
    });

    it('should throw error if reset tokens do not match', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue({ userId: BigInt(1) });
      mockRedis.get.mockResolvedValue('different-hashed-token');
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const [result, error] = await safe(
        authService.resetPasswordWithToken('newpassword', 'reset-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Invalid token');
    });

    it('should throw error if user password not found', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue({ userId: BigInt(1) });
      mockRedis.get.mockResolvedValue('hashed-reset-token');
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.userPassword.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        authService.resetPasswordWithToken('newpassword', 'reset-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should hash new password with argon2', async () => {
      (tokenService.verifyToken as jest.Mock).mockReturnValue({ userId: BigInt(1) });
      mockRedis.get.mockResolvedValue('hashed-reset-token');
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.userPassword.findUnique.mockResolvedValue(mockUserPassword);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await authService.resetPasswordWithToken('newpassword', 'reset-token');

      expect(argon2.hash).toHaveBeenCalledWith('newpassword', {
        type: argon2.argon2id,
      });
    });
  });
});