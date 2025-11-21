import { FastifyReply, FastifyRequest } from "fastify";
import { tokenService, userService, verificationService } from "../../../services";
import { User } from "../../../db/postgres/prisma";
import { safe } from "../../../lib/utils/safe.utils";
import { handleError } from "../../../lib/exceptions";

class OAuthController {
  async oauthCallback(req: FastifyRequest, res: FastifyReply) {
    const user = req.user as User;

    if (!user) {
      return res.status(401).send({
        error: "Login failed",
        details: "No user found",
      });
    }

    const userAgent = req.headers["user-agent"];

    if (!userAgent) {
      return res.status(400).send({
        success: false,
        message: "User agent not found",
      });
    }

    const [tokens, tokensError] = await safe(tokenService.handleTokenCreation(user.id, userAgent));
    if (tokensError) return handleError(res, tokensError);

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = tokens;

    const isVerified = await verificationService.checkIfUserIsVerified(user.id);
    const route = isVerified ? `${process.env.FRONTEND_URL}/` : `${process.env.FRONTEND_URL}/verify`;

    return res
      .header("x-access-token", newAccessToken)
      .setCookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
      .redirect(route);
  }

  
}

export const oAuthController = new OAuthController();