import Joi, { ValidationError } from "joi";
import { Response, ErrorRequestHandler } from "express";
import AppError from "../utils/AppError";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import AppErrorCodes from "../constants/appErrorCodes";
import { clearAuthCookies } from "../utils/cookies";

const handleValidationError = (res: Response, error: ValidationError) => {
  const errors = error.details.map((detail) => ({
    key: detail.context?.key,
    message: detail.message,
  }));

  return res.status(BAD_REQUEST).json({
    errors,
    message: error.message,
  });
};

const handleAppError = (res: Response, error: AppError) => {
  if (error.errorCode === AppErrorCodes.InvalidRefreshToken) {
    clearAuthCookies(res);
  }
  return res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
  });
};

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH ${req.path}`, error);

  if (error instanceof Joi.ValidationError) {
    return handleValidationError(res, error);
  }

  if (error instanceof AppError) {
    return handleAppError(res, error);
  }

  return res.status(INTERNAL_SERVER_ERROR).send("Internal server error");
};

export default errorHandler;
