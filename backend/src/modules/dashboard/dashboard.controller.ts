import { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";

export const dashboardHelloController = asyncHandler(async (req: Request, res: Response) => {
  const name = req.user?.name ?? "Developer";

  res.status(200).json({
    success: true,
    data: {
      message: `Hello, ${name}. Welcome to your file uploader.`,
      user: req.user
    }
  });
});
