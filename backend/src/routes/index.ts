import { Router } from "express";

import xAuthRoutes from "./auth/xAuthRoutes";
import instagramAuthRoutes from "./auth/instagramAuthRoutes";
import socialPostRoutes from "./socialPostRoutes";
import twitchEventSubRoutes from "./twitchEventSubRoutes";

const router = Router();


router.use("/auth/x", xAuthRoutes);
router.use("/auth/instagram", instagramAuthRoutes);


router.use("/posts", socialPostRoutes);


router.use("/twitch", twitchEventSubRoutes);

export default router;