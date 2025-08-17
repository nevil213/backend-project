import { Router } from "express";
import { deleteVideo, getVideoById, publishAVideo, togglePublishStatus, updateThumbnail, updateVideoDetails } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/v/change-thumbnail/:videoId").patch(upload.single("thumbnail"), updateThumbnail);

router.route("/v/delete-video/:videoId").delete(deleteVideo);  // remained for testing

router.route("/v/toggle-publish-status/:videoId").post(togglePublishStatus);


export default router;