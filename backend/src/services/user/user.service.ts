import { prismaService } from "../../db";
import argon2 from "argon2";
import { User } from "../../db/postgres/prisma";
import { generateId } from "../../lib/utils/snowflake.utils";
import { NotFoundError } from "../../lib/exceptions";

class UserService {
    async createUser({ email, username, password, googleId }: { email: string, username: string, password?: string, googleId?: string }): Promise<User> {
        const prisma = prismaService.getClient();

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            throw new Error("Email already in use");
        }

        const id = generateId();

        const user = await prisma.user.create({
            data: {
                id,
                email,
                username,
            },
        });

        if (password) {
            const hashedPassword = await argon2.hash(password, {
                type: argon2.argon2id,
            });

            await prisma.userPassword.create({
                data: {
                    user_id: user.id,
                    password: hashedPassword,
                },
            });
        }

        if (googleId) {
            const oauthId = generateId();

            await prisma.userOAuth.create({
                data: {
                    id: oauthId,
                    user_id: user.id,
                    provider: "google",
                    provider_user_id: googleId,
                },
            });
        }

        return user;
    }

    async getUserById(userId: bigint) {
        const prisma = prismaService.getClient();

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    async getUserByEmail(email: string) {
        const prisma = prismaService.getClient();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) throw new NotFoundError("User not found");

        return user;
    }
}

export const userService = new UserService();