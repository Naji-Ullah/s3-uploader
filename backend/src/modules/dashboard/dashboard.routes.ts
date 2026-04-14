import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { dashboardHelloController } from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, dashboardHelloController);

export default dashboardRouter;
