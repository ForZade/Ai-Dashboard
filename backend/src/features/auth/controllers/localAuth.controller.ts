import { FastifyReply, FastifyRequest } from "fastify";
import { safe } from "../../../lib/utils/safe.utils";
import { handleError } from "../../../lib/exceptions";
import { authService, emailService, otpService, tokenService, userService, verificationService } from "../../../services";
import { LoginType, RegisterType } from "../auth.validators";
import { serializeToJson } from "../../../lib/utils/serialize.utils";

class LocalAuthController {
  async registerUser(req: FastifyRequest<{ Body: RegisterType}>, res: FastifyReply) {
    const { email, password, username } = req.body;

    const [user, userError] = await safe(userService.createUser({email, password, username}));
    if (userError) return handleError(res, userError);

    const userAgent = req.headers["user-agent"];
    if (!userAgent) {
      return res.status(401).send({ 
        success: false,
        message: "Couldn't get user agent",
      });
    }

    const [tokens, tokensError] = await safe(tokenService.handleTokenCreation(user.id, userAgent));
    if (tokensError) return handleError(res, tokensError);

    const { accessToken, refreshToken } = tokens;

    const [otp, otpError] = await safe(otpService.createOtp(email, "email-verification"));
    if (otpError) return handleError(res, otpError)

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
    }).catch(err => console.error("failed to send reset email:", err));;

    return res
      .header("x-access-token", accessToken)
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
      .status(200)
      .send({
        success: true,
        message: "User successfully registered", 
        user: serializeToJson(user),
      });
  }

  async loginUser(req: FastifyRequest<{ Body: LoginType}>, res: FastifyReply) {
    const { email, password } = req.body;

    const [user, userError] = await safe(authService.authenticateUser(email, password));
    if (userError) return handleError(res,userError);

    const userAgent = req.headers["user-agent"];
    if (!userAgent) {
      return res.status(401).send({
        success: false,
        message: "Couldn't get user agent",
      });
    }

    const [tokens, tokensError] = await safe(tokenService.handleTokenCreation(user.id, userAgent));
    if (tokensError) return handleError(res, tokensError);

    const { accessToken, refreshToken } = tokens;

    const isVerified = await verificationService.checkIfUserIsVerified(user.id);
    const route = isVerified ? `${process.env.FRONTEND_URL}/` : `${process.env.FRONTEND_URL}/verify`;

    return res
      .header("x-access-token", accessToken)
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
      .send({
        success: true,
        message: "User logged in successfully"
      })
      .redirect(route)
  }

  logoutUser(req: FastifyRequest, res: FastifyReply) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).send({
      success: true,
      message: "Successfully logged out",
    });
  }
}

export const localAuthController = new LocalAuthController();