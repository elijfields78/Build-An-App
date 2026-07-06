import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import casesRouter from "./cases";
import researchRouter from "./research";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(casesRouter);
router.use(researchRouter);
router.use(openaiRouter);

export default router;
