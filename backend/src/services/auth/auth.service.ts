import { prismaService, redisService } from "../../db";
import argon2 from "argon2";
import { User } from "../../db/postgres/prisma";
import { NotFoundError, UnauthorizedError } from "../../lib/exceptions";
import { tokenService } from "./tokens.service";

export class AuthService {
    async authenticateUser(email: string, password: string): Promise<User> {
        const prisma = prismaService.getClient();
        
        const user = await prisma.user.findUnique({
            where: { email },
        });
        
        if (!user) {
            throw new UnauthorizedError("Invalid credentials");
        }
        
        const userPassword = await prisma.userPassword.findUnique({
            where: { user_id: user.id },
        });
        
        if (!userPassword || !userPassword.password) {
            throw new UnauthorizedError("Invalid credentials");
        }
        
        const passwordMatch = await argon2.verify(userPassword.password, password);
        
        if (!passwordMatch) {
            throw new UnauthorizedError("Invalid credentials");
        }
        
        return user;
    }

    async changePassword(userId: bigint, oldPassword: string, newPassword: string): Promise<void> {
        const prisma = prismaService.getClient();
        
        const userPassword = await prisma.userPassword.findUnique({
            where: { user_id: userId },
        });
        
        if (!userPassword || !userPassword.password) {
            throw new UnauthorizedError("Wrong user authentication method");
        }
        
        const passwordMatching = await argon2.verify(userPassword.password, oldPassword);
        
        if (!passwordMatching) {
            throw new UnauthorizedError("Wrong password");
        }
        
        const hashedPassword = await argon2.hash(newPassword, {
            type: argon2.argon2id,
        });
        
        await prisma.userPassword.update({
            where: { user_id: userId },
            data: { password: hashedPassword },
        });
    }

    async resetPasswordWithToken(newPassword: string, resetToken: string): Promise<void> {
        const prisma = prismaService.getClient();
        const redis = redisService.getClient();
        
        const decrypted = tokenService.verifyToken(resetToken, "reset");
        if (!decrypted || typeof decrypted === "string" || !("userId" in decrypted)) {
            console.log("No shot its problems with decrypted", decrypted);

            throw new UnauthorizedError("Invalid or expired token");
        }

        
        const savedToken = await redis.get(`reset:${decrypted.userId}`);
        if (!savedToken) {
            console.log("We do not have saved token?")

            throw new UnauthorizedError("Invalid or expired token");
        }
        
        const doTokensMatch = await argon2.verify(savedToken, resetToken);
        if (!doTokensMatch) {
            console.log("Tokens do not match?");
            console.log("Saved hashed token:", savedToken);
            console.log("input token:", resetToken);

            throw new UnauthorizedError("Invalid token");
        }
        
        await redis.del(`reset:${decrypted.userId}`);
        
        const userPassword = await prisma.userPassword.findUnique({
            where: { user_id: BigInt(decrypted.userId) },
        });
        
        if (!userPassword) {
            throw new NotFoundError("User not found");
        }
        
        const hashedPassword = await argon2.hash(newPassword, {
            type: argon2.argon2id,
        });
        
        await prisma.userPassword.update({
            where: { user_id: decrypted.userId },
            data: { password: hashedPassword },
        });
    }
}

export const authService = new AuthService();