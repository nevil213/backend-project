import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller";

const router = Router();


router.use(verifyJWT);

router.route("/comment/:commentId").post(toggleCommentLike);
router.route("/video/:videoId").post(toggleVideoLike);
router.route("/tweet/:tweetId").post(toggleTweetLike);
router.route("/get-liked-videos").get(getLikedVideos);

export default router