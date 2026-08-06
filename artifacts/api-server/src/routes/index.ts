import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mediguideRouter from "./mediguide";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mediguideRouter);

export default router;
