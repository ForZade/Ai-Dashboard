import { FastifyReply, FastifyRequest } from "fastify";
import { OtpType } from "../auth.validators";
import { User } from "../../../db/postgres/prisma";
import { emailService, otpService, verificationService } from "../../../services";
import { handleError } from "../../../lib/exceptions";
import { safe } from "../../../lib/utils/safe.utils";

class VerificationController {
    async verifyAuthEmail(req: FastifyRequest<{ Body: OtpType}>, res: FastifyReply) {
        const { otp } = req.body;

        const user = req.user as User;
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found",
            });
        }

        const userId = BigInt(user.id);

        const [, error] = await safe(verificationService.verifyEmail(userId, user.email, otp));
        if (error) return handleError(res, error);

        return res.status(200).send({
            success: true,
            message: "Successfully verified email",
        });
    }

    async resendVerificationEmail(req: FastifyRequest, res: FastifyReply) {
        const user = req.user as User;
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found",
            });
        }

        const [otp, otpError] = await safe(otpService.createOtp(user.email, "email-verification"));

        if (otpError) {
            return res.status(500).send({
                success: false,
                message: "otp was not generated",
            });
        }

        emailService.sendEmail({
            to: user.email,
            subject: "Verify Email",
            html: `
            <h1 style="text-align:center">Verify your Account email address.</h1>
            <p>You've chose this email address for your account. To verify that this account belongs to you, enter the code below on the email verification page:</p>
            <h3><b>${otp}</b></h3>
            <p>This code will expire in 1 hour after this email was sent</p>
            <h2>Why you recieved this email.</h2>
            <p>We require verification whenever an email address is selected for an account. Your account cannot be used until you vefiry it.</p>
            <p>If you did not make this request, you can ignore this email. No account will be created without verification.</p>
            `,
        }).catch(err => console.error("failed to send reset email:", err));

        return res.status(200).send({
            success: true,
            message: "New verification email sent",
        });
    }
}

export const verificationController = new VerificationController();