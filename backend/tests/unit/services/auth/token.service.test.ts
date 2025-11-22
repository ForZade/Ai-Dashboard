// tests/unit/services/token.service.test.ts
import { tokenService } from '../../../../src/services';
import { prismaService } from '../../../../src/db';
import { NotFoundError, UnauthorizedError } from '../../../../src/lib/exceptions';
import { safe } from '../../../../src/lib/utils/safe.utils';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';

jest.mock('../../../../src/db');
jest.mock('jsonwebtoken');
jest.mock('argon2');

describe('TokenService', () => {
  let mockPrisma: any;
  let mockUser: any;

  beforeEach(() => {
    mockPrisma = {
      session: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockUser = {
      id: BigInt(1),
      email: 'test@example.com',
      password: 'hashed-password',
      created_at: new Date(),
    };

    (prismaService.getClient as jest.Mock).mockReturnValue(mockPrisma);
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate access token with 15m expiry', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('access-token');

      const token = await tokenService.generateToken(BigInt(1), 'access');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '1' },
        expect.any(String),
        { expiresIn: '15m' }
      );
      expect(token).toBe('access-token');
    });

    it('should generate refresh token with 30d expiry', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('refresh-token');

      const token = await tokenService.generateToken(BigInt(1), 'refresh');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '1' },
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(token).toBe('refresh-token');
    });

    it('should generate reset token with 15m expiry', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('reset-token');

      const token = await tokenService.generateToken(BigInt(1), 'reset');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '1' },
        expect.any(String),
        { expiresIn: '15m' }
      );
      expect(token).toBe('reset-token');
    });

    it('should convert userId to string in payload', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await tokenService.generateToken(BigInt(123456), 'access');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '123456' },
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should use correct secrets from environment', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await tokenService.generateToken(BigInt(1), 'access');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        process.env.ACCESS_SECRET,
        expect.any(Object)
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });

      const result = tokenService.verifyToken('valid-token', 'access');

      expect(result).toEqual({ userId: '1' });
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('should return null for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = tokenService.verifyToken('invalid-token', 'access');

      expect(result).toBeNull();
    });

    it('should use correct secret for refresh token', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });

      tokenService.verifyToken('token', 'refresh');

      expect(jwt.verify).toHaveBeenCalledWith('token', process.env.REFRESH_SECRET);
    });

    it('should use correct secret for reset token', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });

      tokenService.verifyToken('token', 'reset');

      expect(jwt.verify).toHaveBeenCalledWith('token', process.env.RESET_SECRET);
    });

    it('should handle JWT errors gracefully', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Token expired');
      });

      const result = tokenService.verifyToken('expired-token', 'access');

      expect(result).toBeNull();
    });
  });

  describe('handleTokenCreation', () => {
    it('should delete existing sessions for user and device', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('token');
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-token');

      await tokenService.handleTokenCreation(BigInt(1), 'Mozilla/5.0');

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { user_id: BigInt(1), user_agent: 'Mozilla/5.0' },
      });
    });

    it('should create new session with hashed refresh token', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('refresh-token');
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      await tokenService.handleTokenCreation(BigInt(1), 'Mozilla/5.0');

      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(BigInt),
          session_token: 'hashed-refresh-token',
          user_id: BigInt(1),
          user_agent: 'Mozilla/5.0',
          expires: expect.any(Date),
        },
      });
    });

    it('should return both access and refresh tokens', async () => {
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-token');

      const result = await tokenService.handleTokenCreation(BigInt(1), 'Mozilla/5.0');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should set session expiry to 30 days from now', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('token');
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-token');

      const before = Date.now();
      await tokenService.handleTokenCreation(BigInt(1), 'Mozilla/5.0');
      const after = Date.now();

      const callArgs = mockPrisma.session.create.mock.calls[0][0];
      const expiryTime = callArgs.data.expires.getTime();
      const expectedTime = 30 * 24 * 60 * 60 * 1000;

      expect(expiryTime - before).toBeGreaterThanOrEqual(expectedTime - 1000);
      expect(expiryTime - after).toBeLessThanOrEqual(expectedTime + 1000);
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate refresh token and return user with new tokens', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.session.findFirst.mockResolvedValue({
        session_token: 'hashed-token',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await tokenService.validateRefreshToken('refresh-token', 'Mozilla/5.0');

      expect(result.user).toEqual(mockUser);
      expect(result.newAccessToken).toBe('new-access-token');
      expect(result.newRefreshToken).toBe('new-refresh-token');
    });

    it('should throw error if token is invalid', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(null);

      const [result, error] = await safe(
        tokenService.validateRefreshToken('invalid-token', 'Mozilla/5.0')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if no saved session found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.session.findFirst.mockResolvedValue(null);

      const [result, error] = await safe(
        tokenService.validateRefreshToken('refresh-token', 'Mozilla/5.0')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('No saved refresh token for this device');
    });

    it('should throw error if tokens do not match', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.session.findFirst.mockResolvedValue({
        session_token: 'different-hashed-token',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const [result, error] = await safe(
        tokenService.validateRefreshToken('refresh-token', 'Mozilla/5.0')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('Refresh tokens do not match');
    });

    it('should throw error if user not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.session.findFirst.mockResolvedValue({
        session_token: 'hashed-token',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        tokenService.validateRefreshToken('refresh-token', 'Mozilla/5.0')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should look up session with correct userId and userAgent', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.session.findFirst.mockResolvedValue({
        session_token: 'hashed-token',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await tokenService.validateRefreshToken('refresh-token', 'Mozilla/5.0');

      expect(mockPrisma.session.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: BigInt(1),
          user_agent: 'Mozilla/5.0',
        },
      });
    });
  });

  describe('validateAccessToken', () => {
    it('should validate access token and return user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await tokenService.validateAccessToken('access-token');

      expect(result).toEqual(mockUser);
    });

    it('should throw error if token is invalid', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(null);

      const [result, error] = await safe(
        tokenService.validateAccessToken('invalid-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if token is string', async () => {
      (jwt.verify as jest.Mock).mockReturnValue('string-token');

      const [result, error] = await safe(
        tokenService.validateAccessToken('access-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if user not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        tokenService.validateAccessToken('access-token')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should look up user with correct userId', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '123456' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await tokenService.validateAccessToken('access-token');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(123456) },
      });
    });

    it('should use access token secret for verification', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '1' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await tokenService.validateAccessToken('access-token');

      expect(jwt.verify).toHaveBeenCalledWith('access-token', process.env.ACCESS_SECRET);
    });
  });
});