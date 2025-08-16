import { Router } from "express";
import { getVideoById, publishAVideo, togglePublishStatus, updateThumbnail, updateVideoDetails } from "../controllers/video.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/publish-video").post(upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), publishAVideo);

router.route("/v/:videoId").get(getVideoById);

router.route("/v/change-details/:videoId").patch(updateVideoDetails);

router.route("/v/change-thumbail/:videoId").patch(upload.single({
    name: "thumbnail",
    maxCount: 1
}), updateThumbnail);

router.route("/toggle-publish-status").put(togglePublishStatus);