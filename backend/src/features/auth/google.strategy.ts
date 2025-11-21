import fastifyPassport from "@fastify/passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import dotenv from "dotenv";
import { prismaService } from "../../db";
import { generateId } from "../../lib/utils/snowflake.utils";

dotenv.config();

interface GoogleUser {
  id: string;
  email: string;
  username: string;
  roles: number;
}

fastifyPassport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:7000/api/v1/auth/google/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const username = profile.displayName;

        const prisma = prismaService.getClient();

        // Check if user has been logged in via google already so we don't register them again
        const hasGoogleAccount = await prisma.userOAuth.findFirst({
            where: {
                provider: "google",
                provider_user_id: googleId,
            },
        });

        let user;

        if (!email) {
          return done(new Error("No email found in Google account"), undefined);
        }


        if (!hasGoogleAccount) {
          // Check if user has been registered via another method, if they have we link their local and google accounts.
          user = await prisma.user.findUnique({
            where: {
                email,
            },
          });

          if (user) {
            const id = generateId();

            await prisma.userOAuth.create({
                data: {
                    id,
                    user_id: user.id,
                    provider: "google",
                    provider_user_id: googleId,
                    refresh_token: refreshToken,
                    access_token: accessToken,
                },
            });
          }
        }

        if (hasGoogleAccount) {
          user = await prisma.user.findUnique({
            where: {
              id: hasGoogleAccount.user_id,
            },
          });
        }

        // If there's no account with this email a new account is created.
        if (!user) {
          const id = generateId();
          user = await prisma.user.create({
            data: {
              id,
              email,
              username,
              roles: 1,
            },
          });

          await prisma.userOAuth.create({
            data: {
              id,
              user_id: user.id,
              provider: "google",
              provider_user_id: googleId,
            },
          });
        }

        const safeUser: GoogleUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
        };

        done(null, safeUser);
      } catch (err) {
        console.error("Google login error:", err);
        done(err as Error, undefined);
      }
    },
  ),
);

export default fastifyPassport;