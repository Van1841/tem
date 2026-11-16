import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import setupRouter from "./setup";
import searchRouter from "./search";
import leadsRouter from "./leads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(setupRouter);
router.use(searchRouter);
router.use(leadsRouter);

export default router;
