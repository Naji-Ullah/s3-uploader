import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { listNotificationsController, markNotificationAsReadController } from "../documents/documents.controller";

const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, listNotificationsController);
notificationsRouter.patch("/:id/read", requireAuth, markNotificationAsReadController);

export default notificationsRouter;
