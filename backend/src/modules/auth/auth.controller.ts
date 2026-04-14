import { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import { login, logout, refresh, register } from "./auth.service";
import { LoginInput, RefreshInput, RegisterInput } from "./auth.types";

export const registerController = asyncHandler(async (req: Request<unknown, unknown, RegisterInput>, res: Response) => {
  const data = await register(req.body);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data
  });
});

export const loginController = asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
  const data = await login(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data
  });
});

export const refreshController = asyncHandler(async (req: Request<unknown, unknown, RefreshInput>, res: Response) => {
  const data = await refresh(req.body.refreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data
  });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  await logout(req.user.id);

  res.status(200).json({
    success: true,
    message: "Logout successful"
  });
});
