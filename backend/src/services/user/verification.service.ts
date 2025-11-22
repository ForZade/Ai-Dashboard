import { userService } from './user.service';
import { NotFoundError, UnauthorizedError } from '../../lib/exceptions';
import { prismaService, redisService } from '../../db';
import { otpService } from '../auth/otp.service';
import { safe } from '../../lib/utils/safe.utils';

export class VerificationService {
  async checkIfUserIsVerified(userId: bigint) {
    const user = await userService.getUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const verified = (user.roles & 1) !== 0;

    return verified;
  }

  async verifyEmail(userId: bigint, email: string, otp: string): Promise<void> {
    const prisma = prismaService.getClient();
    const redis = redisService.getClient();

    const [isValid, otpError] = await safe(
      otpService.validateOtp(email, otp, 'email-verification'),
    );
    if (otpError || !isValid) throw new UnauthorizedError('No OTP code saved. Probably expired');

    await redis.del(`otp:email-verification:${email}`);

    const VERIFIED = 1 << 0;

    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        roles: {
          increment: VERIFIED,
        },
      },
    });
  }
}

export const verificationService = new VerificationService();
