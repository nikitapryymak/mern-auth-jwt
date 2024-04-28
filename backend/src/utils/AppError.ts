import AppErrorCodes from "../constants/appErrorCodes";

class AppError extends Error {
  constructor(
    public errorCode: AppErrorCodes,
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export default AppError;
