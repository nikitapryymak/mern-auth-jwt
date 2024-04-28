import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, twoWeeksFromNow } from "./date";

export const REFRESH_PATH = "/auth/refresh";

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  sameSite: "none",
  secure: true,
  httpOnly: true,
  expires: fifteenMinutesFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  sameSite: "none",
  secure: true,
  httpOnly: true,
  expires: twoWeeksFromNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};
export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCookies = (res: Response) =>
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken", { path: REFRESH_PATH });
