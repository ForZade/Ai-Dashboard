import { redisService } from "../../db";
import argon2 from "argon2";
import { BadRequestError } from "../../lib/exceptions";

class OtpService {
    async createOtp(email: string, purpose: "password-reset" | "email-verification") {
        const otp = this.generateOtp();
        const expiresIn = 60 * 5; // 5 min
        const hashedOtp = await argon2.hash(otp, {
            type: argon2.argon2id,
        });

        const redis = redisService.getClient();

        await redis.set(`otp:${purpose}:${email}`, hashedOtp, "EX", expiresIn);

        return otp;
    }

    private generateOtp(): string {
        const digits = "0123456789";
        let otp = "";

        for (let i = 0; i < 6; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }

        return otp;
    }

    async validateOtp(email: string, otp: string, purpose: "password-reset" | "email-verification") {
        const redis = redisService.getClient();
        const otpKey = `otp:${purpose}:${email}`;
        const attemptsKey = `otp-attempts:${purpose}:${email}`;

        const storedOtp = await redis.get(otpKey);
        if (!storedOtp) throw new BadRequestError("OTP has expired or is invalid");


        const isValid = await argon2.verify(storedOtp, otp);
        if (!isValid) {
            const attempts = await redis.incr(attemptsKey);
            if (attempts >= 3) {
                await redis.del(otpKey)
                await redis.del(attemptsKey);
            }

            throw new BadRequestError("OTP has expired or is invalid");
        }
            
        await redis.del(otpKey);

        return isValid;
    }
}

export const otpService = new OtpService();