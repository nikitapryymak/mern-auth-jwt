// @ts-nocheck
import { NotFound } from "../constants/appErrorCodes";
import { NOT_FOUND, OK } from "../constants/http";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await UserModel.findById(req.userId);
  appAssert(user, NotFound, "User not found", NOT_FOUND);
  return res.status(OK).json(user.omitPassword());
});
