import AppErrorCodes from "../constants/appErrorCodes";
import { CREATED, NOT_FOUND, OK, UNAUTHORIZED } from "../constants/http";
import SessionModel from "../models/session.model";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.service";
import appAssert from "../utils/appAssert";
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  setAuthCookies,
} from "../utils/cookies";
import { verifyToken } from "../utils/jwt";
import catchErrors from "../utils/catchErrors";
import validateRequest from "../utils/validateRequest";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.schemas";
import VerificationCodeTypes from "../constants/verificationCodeTypes";
import VerificationCodeModel from "../models/verificationCode.model";

const { InvalidRefreshToken, NotFound } = AppErrorCodes;

export const registerHandler = catchErrors(async (req, res) => {
  const request = validateRequest(registerSchema, {
    ...req.body,
    userAgent: req.headers["user-agent"],
  });
  const { user, accessToken, refreshToken } = await createAccount(request);
  return setAuthCookies({ res, accessToken, refreshToken })
    .status(CREATED)
    .json(user);
});

export const loginHandler = catchErrors(async (req, res) => {
  const request = validateRequest(loginSchema, {
    ...req.body,
    userAgent: req.headers["user-agent"],
  });
  const { accessToken, refreshToken } = await loginUser(request);

  // set cookies
  return setAuthCookies({ res, accessToken, refreshToken })
    .status(OK)
    .json({ message: "Login successful" });
});

export const logoutHandler = catchErrors(async (req, res) => {
  const { accessToken } = req.cookies;
  const { payload } = verifyToken(accessToken);

  if (payload) {
    // remove session from db
    await SessionModel.findByIdAndDelete(payload.sessionId);
  }

  // clear cookies
  return clearAuthCookies(res)
    .status(OK)
    .json({ message: "Logout successful" });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const { refreshToken } = req.cookies;
  appAssert(
    refreshToken,
    InvalidRefreshToken,
    "Missing refresh token",
    UNAUTHORIZED
  );

  const accessToken = await refreshUserAccessToken(refreshToken);
  return res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .json({ message: "Access token refreshed" });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = validateRequest(
    verificationCodeSchema,
    req.params.code
  );
  await verifyEmail(verificationCode);
  return res.status(OK).json({ message: "Email was successfully verified" });
});

export const sendPasswordResetHandler = catchErrors(async (req, res) => {
  const email = validateRequest(emailSchema, req.body.email);
  await sendPasswordResetEmail(email);
  return res.status(OK).json({ message: "Password reset email sent" });
});

export const verifyPasswordResetHandler = catchErrors(async (req, res) => {
  const code = validateRequest(verificationCodeSchema, req.params.code);
  const verificationCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeTypes.PASSWORD_RESET,
    expiresAt: { $gt: new Date() },
  });

  appAssert(verificationCode, NotFound, "Invalid Link", NOT_FOUND);
  return res.status(OK).json({ message: "Link is valid" });
});

export const resetPasswordHandler = catchErrors(async (req, res) => {
  const request = validateRequest(resetPasswordSchema, req.body);
  await resetPassword(request);
  return clearAuthCookies(res)
    .status(OK)
    .json({ message: "Password was reset successfully" });
});
