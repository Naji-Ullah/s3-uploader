import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  loginController,
  logoutController,
  refreshController,
  registerController
} from "./auth.controller";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), registerController);
authRouter.post("/login", validateBody(loginSchema), loginController);
authRouter.post("/refresh", validateBody(refreshSchema), refreshController);
authRouter.post("/logout", requireAuth, logoutController);

export default authRouter;
