// tests/unit/services/otp.service.test.ts
import { otpService } from '../../../../src/services';
import { redisService } from '../../../../src/db';
import { BadRequestError } from '../../../../src/lib/exceptions';
import { safe } from '../../../../src/lib/utils/safe.utils';
import argon2 from 'argon2';

jest.mock('../../../src/db');
jest.mock('argon2');

describe('OtpService', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      incr: jest.fn(),
      del: jest.fn(),
    };
    (redisService.getClient as jest.Mock).mockReturnValue(mockRedis);
    jest.clearAllMocks();
  });

  describe('createOtp', () => {
    it('should generate a 6-digit OTP', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-otp');

      const otp = await otpService.createOtp('test@example.com', 'email-verification');

      expect(otp).toHaveLength(6);
      expect(/^\d+$/.test(otp)).toBe(true);
    });

    it('should hash the OTP with argon2', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-otp');

      await otpService.createOtp('test@example.com', 'email-verification');

      expect(argon2.hash).toHaveBeenCalledWith(
        expect.any(String),
        {
          type: argon2.argon2id,
        }
      );
    });

    it('should store hashed OTP in Redis with 5 min expiration', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-otp');

      await otpService.createOtp('test@example.com', 'email-verification');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'otp:email-verification:test@example.com',
        'hashed-otp',
        'EX',
        300
      );
    });

    it('should work for password-reset purpose', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-otp');

      await otpService.createOtp('test@example.com', 'password-reset');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'otp:password-reset:test@example.com',
        expect.any(String),
        'EX',
        300
      );
    });

    it('should return the plain OTP (not hashed)', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-otp');

      const otp = await otpService.createOtp('test@example.com', 'email-verification');

      expect(otp).not.toBe('hashed-otp');
      expect(otp).toHaveLength(6);
    });
  });

  describe('validateOtp', () => {
    it('should validate correct OTP', async () => {
      mockRedis.get.mockResolvedValue('hashed-otp');
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const [result, error] = await safe(
        otpService.validateOtp('test@example.com', '123456', 'email-verification')
      );

      expect(result).toBe(true);
      expect(error).toBeNull();
      expect(mockRedis.del).toHaveBeenCalledWith('otp:email-verification:test@example.com');
    });

    it('should throw error if OTP not found', async () => {
      mockRedis.get.mockResolvedValue(null);

      const [result, error] = await safe(
        otpService.validateOtp('test@example.com', '123456', 'email-verification')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error?.message).toBe('OTP has expired or is invalid');
    });

    it('should throw error if OTP is invalid', async () => {
      mockRedis.get.mockResolvedValue('hashed-otp');
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      mockRedis.incr.mockResolvedValue(1);

      const [result, error] = await safe(
        otpService.validateOtp('test@example.com', 'wrong', 'email-verification')
      );

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(BadRequestError);
    });

    it('should increment attempts on invalid OTP', async () => {
      mockRedis.get.mockResolvedValue('hashed-otp');
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      mockRedis.incr.mockResolvedValue(1);

      await safe(
        otpService.validateOtp('test@example.com', 'wrong', 'email-verification')
      );

      expect(mockRedis.incr).toHaveBeenCalledWith('otp-attempts:email-verification:test@example.com');
    });

    it('should lock account after 3 failed attempts', async () => {
      mockRedis.get.mockResolvedValue('hashed-otp');
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      mockRedis.incr.mockResolvedValue(3);

      await safe(
        otpService.validateOtp('test@example.com', 'wrong', 'email-verification')
      );

      expect(mockRedis.del).toHaveBeenCalledWith('otp:email-verification:test@example.com');
      expect(mockRedis.del).toHaveBeenCalledWith('otp-attempts:email-verification:test@example.com');
    });

    it('should use correct Redis keys for password-reset', async () => {
      mockRedis.get.mockResolvedValue('hashed-otp');
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const [result, error] = await safe(
        otpService.validateOtp('test@example.com', '123456', 'password-reset')
      );

      expect(result).toBe(true);
      expect(error).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('otp:password-reset:test@example.com');
      expect(mockRedis.del).toHaveBeenCalledWith('otp:password-reset:test@example.com');
    });
  });
});