import { FastifyReply, FastifyRequest } from "fastify";
import { tokenService } from "../services";
import { UnauthorizedError } from "../lib/exceptions";
import { User } from "../db/postgres/prisma";

export async function authMiddleware(req: FastifyRequest, res: FastifyReply) {
  
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];
    let user: User | null = null;
    let rotatedAccessToken: string | null = null;
    let rotatedRefreshToken: string | null = null;

    if (!accessToken) {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new Error("No Refresh Token Found");
        }
        
        const result = await tokenService.validateRefreshToken(refreshToken);
        user = result.user;
        rotatedAccessToken = result.newAccessToken;
        rotatedRefreshToken = result.newRefreshToken;
    } else {
      user = await tokenService.validateAccessToken(accessToken);
    }
    
    if (rotatedAccessToken && rotatedRefreshToken) {
        console.log("We hit token settings");

        res.header("x-access-token", rotatedAccessToken);
        res.cookie("refreshToken", rotatedRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };
  } catch (err: unknown) {
    console.error("Auth middleware error:", err);

    if (err instanceof UnauthorizedError) {
      return res.status(401).send({
        success: false,
        message: err.message,
        code: err.code,
      });
    }
    
    return res.status(401).send({
      success: false,
      message: "Authentication failed",
    });
  }
}