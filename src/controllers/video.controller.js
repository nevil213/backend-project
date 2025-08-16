import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { deleteCloudinaryImage } from "../utils/deleteCloudinaryImage.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body
        // TODO: get video, upload to cloudinary, create video
        if(!(title && description)){
            throw new ApiError(200, "Title and Description required")
        }
    
        const videoRes = await uploadOnCloudinary(req.file?.video);
    
        if(!videoRes){
            throw new ApiError(200, "failed to upload video")
        }
        
        const thumbnailRes = await uploadOnCloudinary(req.file?.thumbnail);
        
        if(!thumbnailRes){
            throw new ApiError(200, "failed to upload video")
        }
    
        const video = await Video.create({
            videoFile: videoRes?.url,
            thumbnail: thumbnailRes?.url,
            title,
            description,
            duration: videoRes.duration,
            owner: req.user?._id        
        })
    
        if(!video){
            throw new ApiError(200, "failed to upload video")
        }
    
        return res.status(200).json(
            new ApiResponse(200, video,"video published successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while publishing a video")
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        //TODO: get video by id
        if(!videoId.trim()){
            throw new ApiError(400, "videoId required")
        }
    
        const video = await Video.aggregate([
            {
                $match: {
                    _id: videoId.trim()
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscribers"
                            }
                        },
                        {
                            $addFields: {
                                "subscriberCount": {
                                    $size: "$subsribers"
                                }
                            }
                        },
                        {   
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1,
                                subscriberCount: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            }
        ])
    
        if(!video){
            throw new ApiError(400, "Error while fetching video")
        }
    
        return res.status(200).json(
            new ApiResponse(200, video, "video fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching wrong")
    }
})

const updateVideoDetails = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        const { title, description } = req.body
        //TODO: update video details like title, description, thumbnail
    
        if(!videoId){
            throw new ApiError(400, "video id is required")
        }
        
        if(!(title || description)){
            throw new ApiError(400, "title or description required for updation");
        }
    
        const video = await Video.findById(videoId);
    
        if(video.owner != req.user?._id){
            throw new ApiError(401, "You are not authorized to update video details")
        }
    
        video.title = title;
        video.description = description;
    
        video.save({ validateBeforeSave: false });
    
        return res.status(200).json(
            new ApiResponse(200, "", "video details updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while updating video details")
    }

})

const updateThumbnail = asyncHandler ( async (req, res) => {
    try {
        const { videoId } = req.params;
    
        if(!videoId){
            throw new ApiError(400, "video id is required")
        }
    
        const video = await Video.findById(videoId);
    
        if(video.owner != req.user?._id){
            throw new ApiError(401, "You are not authorized to update thumbnail")
        }
    
        const thumbnailPath = req.file?.thumbnail;
    
        if(!thumbnailPath){
            throw new ApiError(400, "thumbnail image is required");
        }
    
    
        const thumbnail = await uploadOnCloudinary(thumbnailPath);
    
        if(!thumbnail){
            throw new ApiError(400, "thumbnail uploading failed");
        }

        let thumbnailID = video.thumbnail;
        thumbnailID = thumbnailID.split("/");
        thumbnailID = thumbnailID[thumbnailID-1].split(".")[0];
        
        console.log(thumbnailID);

        await deleteCloudinaryImage(thumbnailID);
    
        // video.thumbnail = thumbnail.url
        // video.save({ validateBeforeSave: false });
    
        const finalVideo = await Video.findByIdAndUpdate(videoId,
            {
                $set: {
                    thumbnail: thumbnail.url
                }
            },
            {
                new: true
            }
        ).select("-owner");
    
        return res.status(200).json(
            new ApiResponse(200, finalVideo, "thumbnail updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating thumbnail")
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId);

    if(video.owner != req.user?._id){
        throw new ApiError(401, "You are not authorized to delete a video");
    }

    // delete likes of video under like schema, comments under comment schema, remove video under playlist schema
    // delete thumnail & video from cloudinary
    // will come after completion of all
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
    
        const video = await Video.findById(videoId);
    
        if(video.owner != req.user?._id){
            throw new ApiError(401, "You are not authorized to change status of publish of a video")
        }
    
        video.isPublished = !video.isPublished;
        
        video.save({ validateBeforeSave: false });
    
        return res.status(200).json(
            new ApiResponse(200, "", "pubish status of video toggled successfully")
        );
    } catch (error) {
        throw new ApiError(500, "something went wrong while changing publish status of a video");
    }
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus
}