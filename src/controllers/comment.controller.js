import mongoose, { connect } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params;
    const { content } = req.body;

    if(!(videoId && content)){
        throw new ApiError(400, "video id and content required, for comment");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if(!comment){
        throw new ApiError(500, "failed to add comment");
    }

    return res.status(200).json(
        new ApiResponse(200, comment, "comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    
    if(!commentId){
        throw new ApiError(400, "comment if required to update comment");
    }

    const comment = await Comment.findById(commentId);

    if(!comment.owner.equals(req.user?._id)){
        throw new ApiError(401, "you are not authorized to update this comment");
    }

    comment.content = content;
    await comment.save({ validateBeforeSave: false });
    
    return res.status(200).json(
        new ApiResponse(200, "", "comment updated successfully")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    if(!commentId){
        throw new ApiError(400, "comment id is required for delete comment");
    }

    const comment = await Comment.findById(commentId);

    if(!comment.owner.equals(req.user?._id)){
        throw new ApiError(401, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);
    
    // delete likes of that comment in Like collection as well

    await Like.deleteMany({comment: commentId});

    return res.status(200).json(
        new ApiResponse(200, "", "comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}