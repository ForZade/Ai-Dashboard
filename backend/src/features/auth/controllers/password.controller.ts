import { FastifyReply, FastifyRequest } from "fastify";
import { handleError } from "../../../lib/exceptions";
import { EmailType, ChangePasswordType, ResetPasswordType, OtpType, ValidateOtpType } from "../auth.validators";
import { User } from "../../../db/postgres/prisma";
import { authService, emailService, otpService, tokenService, userService } from "../../../services";
import { safe } from "../../../lib/utils/safe.utils";
import { prismaService, redisService } from "../../../db";
import argon2 from "argon2";

class PasswordController {
    async changePassword(req: FastifyRequest<{ Body: ChangePasswordType }>, res: FastifyReply) {
        const { oldPassword, newPassword } = req.body;

        const user = req.user as User;
        if (!user) {
            return res.status(404).send({ message: "User not found"});
        }

        const userId = BigInt(user.id);

        const [, error] = await safe(authService.changePassword(userId, oldPassword, newPassword));
        if (error) return handleError(res, error);

        return res.status(200).send({
            success: true,
            message: "Password changed successfully",
        });
    }

    async requestPasswordReset(req: FastifyRequest<{ Body: EmailType}>, res: FastifyReply) {
        const { email } = req.body;
        const prisma = prismaService.getClient();

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return res.status(401).send({
                success: false,
                message: "No user registered with this email",
            });
        }

        const [otp, otpError] = await safe(otpService.createOtp(email, "password-reset"));
        if (otpError) return handleError(res, otpError);

        emailService.sendEmail({
            to: user.email,
            subject: "Reset Password",
            html: `
                <h1 style="text-align:center; font-family: Arial, sans-serif;">Reset your AI Dashboard Account Password</h1>

                <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
                An account registered with your email address requested a password reset. 
                To verify that this account belongs to you, enter the code below on the password reset page:
                </p>

                <h3><b>${otp}</b></h3>

                <p style="font-family: Arial, sans-serif; font-size: 14px; color: gray;">
                This code will expire 15 minutes after this email was sent.
                </p>

                <h2 style="font-family: Arial, sans-serif;">Why you received this email</h2>

                <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
                AI Dashbord requires verification whenever a password reset is requested. 
                You will not be able to change your password without this code.
                </p>

                <p style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
                If you did not make this request, you can safely ignore this email. 
                Your account password will remain unchanged.
                </p>
            `,
        }).catch(err => console.error("failed to send reset email:", err));

        return res.status(200).send({
            success: true,
            message: "Password reset code sent to users email",
        });
    }

    async validatePasswordReset(req: FastifyRequest<{ Body: ValidateOtpType }>, res: FastifyReply) {
        const { otp, email } = req.body;

        if (!otp) return res.status(401).send({
            success: false,
            message: "OTP is missing",
        });

        const [, otpError] = await safe(otpService.validateOtp(email, otp, "password-reset"));
        if (otpError) return handleError(res, otpError);

        const [user, userError] = await safe(userService.getUserByEmail(email));
        if (userError) return handleError(res, userError);

        const userId = BigInt(user.id);

        const [token, tokenError] = await safe(tokenService.generateToken(userId, "reset"));
        if (tokenError) return handleError(res, tokenError);

        const hashedToken = await argon2.hash(token, {
            type: argon2.argon2id,
        });

        const redis = redisService.getClient();

        redis.set(`reset:${user.id}`, hashedToken, "EX", 60 * 15)

        return res.status(200).send({
            success: true,
            message: "OTP Code verified",
            resetToken: token,
        });
    }

    async resetPassword(req: FastifyRequest<{ Body: ResetPasswordType }>, res: FastifyReply) {
        const { newPassword, resetToken } = req.body;

        if (!resetToken) {
            return res.status(401).send({
                success: false,
                message: "Reset token is missing",
            });
        }

        console.log(resetToken);

        const [, error] = await safe(authService.resetPasswordWithToken(newPassword, resetToken));
        if (error) return handleError(res, error);

        return res.status(200).send({
            success: true,
            message: "Password reset successfully",
        });
    }
}

export const passwordController = new PasswordController();