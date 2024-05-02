import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import AppErrorCodes from "../constants/appErrorCodes";
import { UNAUTHORIZED } from "../constants/http";
import { verifyToken } from "../utils/jwt";

// wrap with catchErrors() if you need this to be async
const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  appAssert(
    accessToken,
    UNAUTHORIZED,
    "Not authorized",
    AppErrorCodes.InvalidAccessToken
  );

  const { error, payload } = verifyToken(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired" ? "Token expired" : "Invalid token",
    AppErrorCodes.InvalidAccessToken
  );

  req.userId = payload.userId;
  req.sessionId = payload.sessionId;
  next();
};

export default authenticate;
