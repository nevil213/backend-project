import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());




// import routes
import userRoute from "./routes/user.route.js"
import videoRoute from "./routes/video.route.js"
import commentRoute from "./routes/comment.route.js"
import playlistRoute from "./routes/playlist.route.js"
import tweetRoute from "./routes/tweet.route.js"
import likeRoute from "./routes/like.route.js"

// declaration of routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/video", videoRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/playlist", playlistRoute);
app.use("/api/v1/tweet", tweetRoute);
app.use("/api/v1/like", likeRoute);

export { app };