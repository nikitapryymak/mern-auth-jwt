import assert from "node:assert";
import AppError from "./AppError";
import { INTERNAL_SERVER_ERROR } from "../constants/http";
import AppErrorCodes from "../constants/appErrorCodes";

type AppAssert = (
  condition: any,
  appErrorCode: AppErrorCodes,
  message: string,
  statusCode?: number
) => asserts condition;
/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 */
const appAssert: AppAssert = (
  condition,
  appErrorCode,
  message,
  statusCode = INTERNAL_SERVER_ERROR
): asserts condition =>
  assert(condition, new AppError(appErrorCode, message, statusCode));

export default appAssert;
