import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(400, "video id is required for like a video");
    }
    try {
        const like = await Like.find({video: videoId, likedBy: req.user?._id});
    
        if(!like){
            await Like.create({
                video: videoId,
                likedBy: req.user?._id
            })
        }
        else{
            await Like.findOneAndDelete({
                video: videoId,
                likedBy: req.user?._id
            })
        }
    
        return res.status(200).json(
            new ApiResponse(200, "", "video like toggled successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while toggling video like")
    }  
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400, "comment id is required for like a comment");
    }
    try {
        const like = await Like.find({comment: commentId, likedBy: req.user?._id});
    
        if(!like){
            await Like.create({
                comment: commentId,
                likedBy: req.user?._id
            })
        }
        else{
            await Like.findOneAndDelete({
                comment: commentId,
                likedBy: req.user?._id
            })
        }
    
        return res.status(200).json(
            new ApiResponse(200, "", "comment like toggled successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while toggling comment like")
    }  

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400, "tweet id is required for like a tweet");
    }
    try {
        const like = await Like.find({tweet: tweetId, likedBy: req.user?._id});
    
        if(!like){
            await Like.create({
                tweet: tweetId,
                likedBy: req.user?._id
            })
        }
        else{
            await Like.findOneAndDelete({
                tweet: tweetId,
                likedBy: req.user?._id
            })
        }
    
        return res.status(200).json(
            new ApiResponse(200, "", "tweet like toggled successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while toggling tweet like")
    }  
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: req.user?._id
                }
            },
            {
                $project: {
                    video: 1
                }
            }
        ]);

        if(!likedVideos){
            return res.status(404).json(
                new ApiResponse(200, "", "you have not liked to any video")
            )
        }
    
        return res.status(200).json(
            new ApiResponse(200, likedVideos, "liked videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while fetching liked videos")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}