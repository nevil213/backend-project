import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/create-tweet").post(verifyJWT, createTweet);
router.route("/t/:username").get(getUserTweets);
router.route("/update-tweet/:tweetId").put(verifyJWT, updateTweet);
router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet);