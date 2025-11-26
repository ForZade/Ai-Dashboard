import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../lib/exceptions";
import { prismaService } from "../../db";
import { generateId } from "../../lib/utils/snowflake.utils";


export class TokenService {
    private accessTokenSecret: string;
    private refreshTokenSecret: string;
    private resetTokenSecret: string;

    constructor() {
        this.accessTokenSecret = process.env.ACCESS_SECRET || "";
        this.refreshTokenSecret = process.env.REFRESH_SECRET || "";
        this.resetTokenSecret = process.env.RESET_SECRET || "";
    }

    async generateToken(userId: bigint, tokenType: "access" | "refresh" | "reset", userAgent?: string): Promise<string> {
        if (tokenType === "refresh" && !userAgent) {
            throw new BadRequestError("User Agent is required for refresh token");
        }

        let secret: string;
        let expiresIn: "15m" | "30d";
        let payload: { userId: string, userAgent?: string } = { userId: userId.toString() }

        switch(tokenType) {
            case "access":
                secret = this.accessTokenSecret;
                expiresIn = "15m";
                break;

            case "refresh":
                secret = this.refreshTokenSecret;
                expiresIn = "30d";
                payload = { userId: userId.toString(), userAgent }
                break;

            case "reset":
                secret = this.resetTokenSecret;
                expiresIn = "15m";
                break;
        }

        return jwt.sign(
            payload,
            secret,
            { expiresIn },
        );
    }

    verifyToken(token: string, tokenType: "access" | "refresh" | "reset"): string | jwt.JwtPayload | null {
        let secret: string;

        switch(tokenType) {
            case "access":
                secret = this.accessTokenSecret;
                break;

            case "refresh":
                secret = this.refreshTokenSecret;
                break;

            case "reset":
                secret = this.resetTokenSecret;
                break;
        }

        try {
            return jwt.verify(token, secret);
        } catch {
            return null;
        }
    }

    async handleTokenCreation(userId: bigint, userAgent: string) {
        const prisma = prismaService.getClient();

        await prisma.session.deleteMany({
            where: { user_id: userId, user_agent: userAgent }
        });

        const newAccessToken = await this.generateToken(userId, "access");
        const newRefreshToken = await this.generateToken(userId, "refresh", userAgent);

        const id = generateId();
        const hashedRefreshToken = await argon2.hash(newRefreshToken, {
            type: argon2.argon2id,
        });

        await prisma.session.create({
            data: {
                id,
                session_token: hashedRefreshToken,
                user_id: userId,
                user_agent: userAgent,
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    async validateRefreshToken(refreshToken: string) {
        const prisma = prismaService.getClient();
        
        const decoded = this.verifyToken(refreshToken, "refresh");
        
        if (!decoded || typeof decoded === "string") {
            throw new UnauthorizedError("Invalid refresh token");
        }

        const userAgent = decoded.userAgent;
        
        const hashedRefreshToken = await prisma.session.findFirst({
            where: {
                user_id: BigInt(decoded.userId),
                user_agent: userAgent
            },
        });
        
        if (!hashedRefreshToken) {
            throw new UnauthorizedError("No saved refresh token for this device");
        }
        
        const doTokensMatch = await argon2.verify(hashedRefreshToken.session_token, refreshToken);
        
        if (!doTokensMatch) {
            throw new UnauthorizedError("Refresh tokens do not match");
        }
        
        const user = await prisma.user.findUnique({
            where: { id: BigInt(decoded.userId) },
        });
        
        if (!user) {
            throw new NotFoundError("User not found");
        }

        console.log("old token:")
        console.log(refreshToken)
        console.log(decoded)
        
        const { refreshToken: newRefreshToken, accessToken: newAccessToken } = 
            await this.handleTokenCreation(decoded.userId, userAgent);

        const newDecoded = tokenService.verifyToken(refreshToken, "refresh");

        console.log("new token:")
        console.log(newRefreshToken);
        console.log(newDecoded);
        
        return { user, newAccessToken, newRefreshToken };
    }

    async validateAccessToken(accessToken: string) {
        const prisma = prismaService.getClient();
        
        const decoded = this.verifyToken(accessToken, "access");
        
        if (!decoded || typeof decoded === "string") {
            throw new UnauthorizedError("Invalid access token");
        }
        
        const user = await prisma.user.findUnique({
            where: { id: BigInt(decoded.userId) },
        });
        
        if (!user) {
            throw new NotFoundError("User not found");
        }
        
        return user;
    }
}

export const tokenService = new TokenService();