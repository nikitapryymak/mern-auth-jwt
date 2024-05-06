import { APP_ORIGIN, JWT_REFRESH_SECRET } from "../constants/env";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
  UNPROCESSABLE_CONTENT,
} from "../constants/http";
import VerificationCodeTypes from "../constants/verificationCodeTypes";
import SessionModel, { SessionDocument } from "../models/session.model";
import UserModel, { UserDocument } from "../models/user.model";
import VerificationCodeModel, {
  VerificationCodeDocument,
} from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import { hashValue } from "../utils/bcrypt";
import {
  ONE_DAY_MS,
  fiveMinutesAgo,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplates";
import {
  REFRESH_TOKEN_EXP,
  RefreshToken,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { sendMail } from "../utils/sendMail";

export type CreateAccountParams = Pick<UserDocument, "email" | "password"> &
  Pick<SessionDocument, "userAgent">;

export const createAccount = async (data: CreateAccountParams) => {
  // verify email is not taken
  const existingUser = await UserModel.exists({
    email: data.email,
  });
  appAssert(!existingUser, CONFLICT, "Email already in use");

  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeTypes.EMAIL_VERIFICATION,
    expiresAt: oneYearFromNow(),
  });

  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;

  // send verification email
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });
  // ignore email errors for now
  if (error) console.error(error);

  // create session
  const session = await SessionModel.create({
    userId: user._id,
    userAgent: data.userAgent,
  });

  // create refresh token
  const refreshToken = signToken(
    {
      sessionId: session._id,
    },
    {
      secret: JWT_REFRESH_SECRET,
      expiresIn: REFRESH_TOKEN_EXP,
    }
  );
  const accessToken = signToken({ userId: user._id, sessionId: session._id });
  return { user: user.omitPassword(), accessToken, refreshToken };
};

export type LoginParams = Pick<UserDocument, "email" | "password"> &
  Pick<SessionDocument, "userAgent">;

export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "Invalid email or password");

  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  const userId = user._id;
  const session = await SessionModel.create({
    userId,
    userAgent,
  });

  const sessionInfo: RefreshToken = {
    sessionId: session._id,
  };

  const refreshToken = signToken(sessionInfo, {
    secret: JWT_REFRESH_SECRET,
    expiresIn: REFRESH_TOKEN_EXP,
  });

  const accessToken = signToken({ ...sessionInfo, userId });
  return { user, accessToken, refreshToken };
};

export const verifyEmail = async (code: VerificationCodeDocument["_id"]) => {
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeTypes.EMAIL_VERIFICATION,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid verification code");

  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { new: true }
  );
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to update user");

  await validCode.deleteOne();

  return { user: updatedUser.omitPassword() };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshToken>(refreshToken, {
    secret: JWT_REFRESH_SECRET,
  });

  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

  // get the session
  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(
    session && session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    "Session exipred"
  );

  // refresh the session if it expires in the next 24hrs
  if (session.expiresAt.getTime() - now <= ONE_DAY_MS) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  // create new access token
  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return accessToken;
};

export const sendPasswordResetEmail = async (email: UserDocument["email"]) => {
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "User not found");

  // check for max password reset requests (2 emails in 5min)
  const fiveMinAgo = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    userId: user._id,
    type: VerificationCodeTypes.PASSWORD_RESET,
    createdAt: { $gt: fiveMinAgo },
  });
  appAssert(
    count <= 1,
    TOO_MANY_REQUESTS,
    "Too many requests, please try again later"
  );

  const expiresAt = oneHourFromNow();
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeTypes.PASSWORD_RESET,
    expiresAt,
  });

  const url = `${APP_ORIGIN}/password/reset?code=${
    verificationCode._id
  }&exp=${expiresAt.getTime()}`;

  const { data, error } = await sendMail({
    to: email,
    ...getPasswordResetTemplate(url),
  });

  appAssert(
    data?.id,
    INTERNAL_SERVER_ERROR,
    `${error?.name} - ${error?.message}`
  );
  return {
    url,
    emailId: data.id,
  };
};

export type ResetPasswordParams = {
  password: UserDocument["password"];
  verificationCode: VerificationCodeDocument["_id"];
};

export const resetPassword = async ({
  verificationCode,
  password,
}: ResetPasswordParams) => {
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeTypes.PASSWORD_RESET,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, UNPROCESSABLE_CONTENT, "This link is not valid");

  const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
    password: await hashValue(password),
  });
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to update user");

  await validCode.deleteOne();

  // delete all sessions
  await SessionModel.deleteMany({ userId: validCode.userId });

  return { user: updatedUser.omitPassword() };
};
