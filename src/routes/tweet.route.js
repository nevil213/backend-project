import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-tweet").post(verifyJWT, createTweet);
router.route("/t/:username").get(getUserTweets);
router.route("/update-tweet/:tweetId").put(verifyJWT, updateTweet);
router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet);

export default router