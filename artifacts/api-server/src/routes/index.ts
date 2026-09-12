import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subscriptionsRouter from "./subscriptions";
import authRouter from "./auth";
import scanRouter from "./scan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(subscriptionsRouter);
router.use(authRouter);
router.use(scanRouter);

export default router;
