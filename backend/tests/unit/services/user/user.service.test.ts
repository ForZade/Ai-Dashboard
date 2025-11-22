// tests/unit/services/user/user.service.test.ts
import { userService } from '../../../../src/services';
import { prismaService } from '../../../../src/db';
import { NotFoundError } from '../../../../src/lib/exceptions';
import { safe } from '../../../../src/lib/utils/safe.utils';
import argon2 from 'argon2';

jest.mock('../../../../src/db');
jest.mock('argon2');
jest.mock('../../../../src/lib/utils/snowflake.utils', () => ({
  generateId: jest.fn(() => BigInt(123456789)),
}));

describe('UserService', () => {
  let mockPrisma: any;
  let mockUser: any;

  beforeEach(() => {
    mockUser = {
      id: BigInt(1),
      email: 'test@example.com',
      username: 'testuser',
      created_at: new Date(),
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userPassword: {
        create: jest.fn(),
      },
      userOAuth: {
        create: jest.fn(),
      },
    };

    (prismaService.getClient as jest.Mock).mockReturnValue(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with email and username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(BigInt),
          email: 'test@example.com',
          username: 'testuser',
        },
      });
    });

    it('should throw error if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const [result, error] = await safe(
        userService.createUser({
          email: 'test@example.com',
          username: 'testuser',
        })
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Email already in use');
    });

    it('should create user with password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');

      await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      expect(argon2.hash).toHaveBeenCalledWith('password123', {
        type: argon2.argon2id,
      });
      expect(mockPrisma.userPassword.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          password: 'hashed-password',
        },
      });
    });

    it('should not create password record if password not provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(mockPrisma.userPassword.create).not.toHaveBeenCalled();
    });

    it('should create user with Google OAuth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        googleId: 'google-123',
      });

      expect(mockPrisma.userOAuth.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(BigInt),
          user_id: mockUser.id,
          provider: 'google',
          provider_user_id: 'google-123',
        },
      });
    });

    it('should create user with both password and Google OAuth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');

      await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        googleId: 'google-123',
      });

      expect(mockPrisma.userPassword.create).toHaveBeenCalled();
      expect(mockPrisma.userOAuth.create).toHaveBeenCalled();
    });

    it('should not create OAuth record if googleId not provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(mockPrisma.userOAuth.create).not.toHaveBeenCalled();
    });

    it('should check email uniqueness before creating user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById(BigInt(1));

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });

    it('should throw NotFoundError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(userService.getUserById(BigInt(999)));

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error?.message).toBe('User not found');
    });

    it('should query with correct user id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await userService.getUserById(BigInt(123456789));

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(123456789) },
      });
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        userService.getUserByEmail('nonexistent@example.com')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error?.message).toBe('User not found');
    });

    it('should query with correct email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await userService.getUserByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should be case-sensitive for email lookup', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const [result, error] = await safe(
        userService.getUserByEmail('TEST@EXAMPLE.COM')
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'TEST@EXAMPLE.COM' },
      });
    });
  });
});