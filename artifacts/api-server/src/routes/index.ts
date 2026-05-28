import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyticsRouter from "./analytics";
import usersRouter from "./users";
import telemetryRouter from "./telemetry";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyticsRouter);
router.use(usersRouter);
router.use(telemetryRouter);

export default router;
