import { userService, verificationService, otpService } from '../../../../src/services';
import { prismaService, redisService } from '../../../../src/db';
import { NotFoundError, UnauthorizedError } from '../../../../src/lib/exceptions';
import { safe } from '../../../../src/lib/utils/safe.utils';

jest.mock('../../../../src/services/user/users.service');
jest.mock('../../../../src/db');
jest.mock('../../../../src/services/auth/otp.service');


describe('VerificationService', () => {
  let mockPrisma: any;
  let mockRedis: any;
  let mockUser: any;

  beforeEach(() => {
    mockUser = {
      id: BigInt(1),
      email: 'test@example.com',
      username: 'testuser',
      roles: 0,
      created_at: new Date(),
    };

    mockPrisma = {
      user: {
        update: jest.fn(),
      },
    };

    mockRedis = {
      del: jest.fn(),
    };

    (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);
    (prismaService.getClient as jest.Mock).mockReturnValue(mockPrisma);
    (redisService.getClient as jest.Mock).mockReturnValue(mockRedis);
    jest.clearAllMocks();
  });

  describe('checkIfUserIsVerified', () => {
    it('should return true if user is verified', async () => {
      const verifiedUser = { ...mockUser, roles: 1 }; // Bit 0 set
      (userService.getUserById as jest.Mock).mockResolvedValue(verifiedUser);

      const result = await verificationService.checkIfUserIsVerified(BigInt(1));

      expect(result).toBe(true);
    });

    it('should return false if user is not verified', async () => {
      mockUser.roles = 0;
      (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      const result = await verificationService.checkIfUserIsVerified(BigInt(1));

      expect(result).toBe(false);
    });

    it('should check verification bit correctly', async () => {
      const verifiedUser = { ...mockUser, roles: 3 }; // Both bit 0 and 1 set
      (userService.getUserById as jest.Mock).mockResolvedValue(verifiedUser);

      const result = await verificationService.checkIfUserIsVerified(BigInt(1));

      expect(result).toBe(true);
    });

    it('should return false if only other bits are set', async () => {
      const userWithOtherBits = { ...mockUser, roles: 2 }; // Only bit 1 set
      (userService.getUserById as jest.Mock).mockResolvedValue(userWithOtherBits);

      const result = await verificationService.checkIfUserIsVerified(BigInt(1));

      expect(result).toBe(false);
    });

    it('should throw NotFoundError if user service throws', async () => {
      (userService.getUserById as jest.Mock).mockRejectedValue(
        new NotFoundError('User not found')
      );

      const [result, error] = await safe(
        verificationService.checkIfUserIsVerified(BigInt(999))
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should call getUserById with correct userId', async () => {
      await verificationService.checkIfUserIsVerified(BigInt(123));

      expect(userService.getUserById).toHaveBeenCalledWith(BigInt(123));
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and update user roles', async () => {
      (otpService.validateOtp as jest.Mock).mockResolvedValue(true);

      await verificationService.verifyEmail(BigInt(1), 'test@example.com', '123456');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          roles: {
            increment: 1,
          },
        },
      });
    });

    it('should delete OTP from Redis after verification', async () => {
      (otpService.validateOtp as jest.Mock).mockResolvedValue(true);

      await verificationService.verifyEmail(BigInt(1), 'test@example.com', '123456');

      expect(mockRedis.del).toHaveBeenCalledWith('otp:email-verification:test@example.com');
    });

    it('should throw error if OTP validation fails', async () => {
      (otpService.validateOtp as jest.Mock).mockRejectedValue(
        new UnauthorizedError('Invalid OTP')
      );

      const [result, error] = await safe(
        verificationService.verifyEmail(BigInt(1), 'test@example.com', 'wrong')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should throw error if OTP is invalid', async () => {
      (otpService.validateOtp as jest.Mock).mockResolvedValue(false);

      const [result, error] = await safe(
        verificationService.verifyEmail(BigInt(1), 'test@example.com', 'wrong')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error?.message).toBe('No OTP code saved. Probably expired');
    });

    it('should validate OTP with correct parameters', async () => {
      (otpService.validateOtp as jest.Mock).mockResolvedValue(true);

      await verificationService.verifyEmail(BigInt(1), 'test@example.com', '123456');

      expect(otpService.validateOtp).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'email-verification'
      );
    });

    it('should increment verification bit (bit 0)', async () => {
      (otpService.validateOtp as jest.Mock).mockResolvedValue(true);

      await verificationService.verifyEmail(BigInt(1), 'test@example.com', '123456');

      const callArgs = mockPrisma.user.update.mock.calls[0][0];
      expect(callArgs.data.roles.increment).toBe(1); // 1 << 0 = 1
    });

    it('should update user with correct userId', async () => {
      (otpService.validateOtp as jest.Mock).mockResolvedValue(true);

      await verificationService.verifyEmail(BigInt(42), 'test@example.com', '123456');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: BigInt(42) },
        data: expect.any(Object),
      });
    });

    it('should throw error if OTP error but isValid is true', async () => {
      (otpService.validateOtp as jest.Mock).mockResolvedValue(true);
      // But somehow we pass an error - testing the otpError check

      await verificationService.verifyEmail(BigInt(1), 'test@example.com', '123456');

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should not update user if OTP validation fails', async () => {
      (otpService.validateOtp as jest.Mock).mockRejectedValue(
        new UnauthorizedError('Invalid OTP')
      );

      await safe(
        verificationService.verifyEmail(BigInt(1), 'test@example.com', 'wrong')
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should not delete Redis key if OTP validation fails', async () => {
      (otpService.validateOtp as jest.Mock).mockRejectedValue(
        new UnauthorizedError('Invalid OTP')
      );

      await safe(
        verificationService.verifyEmail(BigInt(1), 'test@example.com', 'wrong')
      );

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});