import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!(name && description)){
        throw new ApiError("name and description required for creating playlist");
    }

    if(!req.user?._id){
        throw new ApiError(400, "please login for create playlist");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist){
        throw new ApiError(500, "something went wrong while creating playlist");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    // const playlist = await Playlist.aggregate([
    //     {
    //         $match: {
    //             owner: userId
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             localField: "videos",
    //             foreignField: "_id",
    //             as: "videos",
    //             pipeline: [
    //                 {
    //                     $match: {
    //                         isPublished: true
    //                     }
    //                 },
    //                 {
    //                     $lookup: {
    //                         from: "users",
    //                         localField: "owner",
    //                         foreignField: "_id",
    //                         as: "owner",
    //                         pipeline: [
    //                             {
    //                                 $project: {
    //                                     username: 1,
    //                                     fullname: 1,
    //                                     avatar: 1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $addFields: {
    //                         owner: {
    //                             $first: "$owner"
    //                         }
    //                     }
    //                 }
    //             ]
    //         }
    //     }
    // ]);

    if(!userId){
        throw new ApiError(400, "user id is required for fetch playlists")
    }

    const playlist = await Playlist.findById({owner: userId}).select("-videos")
    
    if(!playlist){
        throw new ApiError(404, "user has no playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "playlists fetched successfully")
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId){
        throw new ApiError(400, "playlist id is required for fetch playlist")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: playlistId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
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
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
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
                    },
                    {
                        $project: {
                            _id,
                            owner,
                            thumbnail,
                            title,
                            description,
                            duration,
                            views
                        }
                    }
                ]
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
                        $project: {
                            username: 1,
                            fullname,
                            avatar: 1
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

    if(!playlist){
        throw new ApiError(404, "playlist is empty");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!(playlistId && videoId)){
        throw new ApiError(400, "playlistId and videoId required for add video to playlist");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(500, "something went wrong while fetching playlist");
    }

    if(playlist.owner != req.user?._id){
        throw new ApiError(401, "you are not authorized to add video to this playlist");
    }

    // playlist.videos.push(videoId);
    // await playlist.save({ validateBeforeSave: false });

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { videos: videoId }
        },
        { new: true }
    );

    if(!updatedPlaylist){
        throw new ApiError(500, "something went wrong whille adding video to the playlist");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!(playlistId && videoId)){
        throw new ApiError(400, "playlistId and videoId required for remove video from playlist");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(500, "something went wrong while fetching playlist");
    }

    if(playlist.owner != req.user?._id){
        throw new ApiError(401, "you are not authorized to remove video from this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $pull: {
                videos: videoId
            }
        },
        {
            $new: true
        }
    )

    if(!updatePlaylist){
        throw new ApiError(400, "something went wrong while removing video from playlist");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "video removed from playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId} = req.params
        // TODO: delete playlist
    
        if(!playlistId){
            throw new ApiError(400, "playlistId required for delete playlist");
        }
    
        const playlist = await Playlist.findById(playlistId);
    
        if(!playlist){
            throw new ApiError(404, "Playlist not found");
        }
    
        if(playlist.owner != req.user?._id){
            throw new ApiError(401, "you are not authorized to add video to this playlist");
        }
    
        await Playlist.findByIdAndDelete(playlistId);
    
        return res.status(200).json(
            new ApiResponse(200, "", "playlist deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while deletting playlist")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId){
        throw new ApiError(400, "playlistId required for update playlist");
    }
    if(!(name || description)){
        throw new ApiError(400, "name or description required for update playlist");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }
    
    if(playlist.owner != req.user?._id){
        throw new ApiError(401, "you are not authorized to update this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist, 
        {
            $set: {
                name,
                description
            }
        },
        {
            $new: true
        }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "playlist updated successfully")
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
