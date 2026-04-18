import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { createCategoryController, listCategoriesController } from "../documents/documents.controller";
import { createCategorySchema } from "./categories.schemas";

const categoriesRouter = Router();

categoriesRouter.get("/", requireAuth, listCategoriesController);
categoriesRouter.post("/", requireAuth, validateBody(createCategorySchema), createCategoryController);

export default categoriesRouter;
