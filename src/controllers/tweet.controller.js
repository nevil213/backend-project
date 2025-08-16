import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if(!content){
        throw new ApiError(400, "content is required to create tweet");
    }
    
    const tweet = await Tweet.create({
        owner: req.user?._id,
        content
    })

    if(!tweet){
        throw new ApiError(500, "failed to create tweet");
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { username } = req.params;

    if(!username){
        throw new ApiError(400, "username is required to get user tweets");
    }

    const user = await User.aggregate([
        {
            $match: {
                username: username
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets",
                pipeline: [
                    {
                        $project: {
                            content: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                tweets: {
                    $first: "$tweets"
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                tweets: 1
            }
        }
    ])

    if(!user){
        throw new ApiError(500, "something went wrong while fetching tweets");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "all tweets fetched successfully")
    )
    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;

    const { content } = req.body;

    if(!(tweetId && content)){
        throw new ApiError(400, "tweet id & content required for update tweet");
    }

    const tweet = new Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(500, "error while fetching tweet details")
    }

    if(tweet.owner != req.user?._id){
        throw new ApiError(401, "you are not authorized to update this tweet");
    }

    tweet.content = content;

    await tweet.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, "", "tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    try {
        const { tweetId } = req.params;
    
        if(!tweetId){
            throw new ApiError(400, "tweet id is required for delete tweet");
        }
    
        const tweet = await Tweet.findById(tweetId);
    
        if(!tweet){
            throw new ApiError(500, "error fetching tweet details");
        }
    
        if(tweet.owner != req.user?._id){
            throw new ApiError(401, "you are not authorized to delete tweet");
        }
    
        await Tweet.findByIdAndDelete(tweetId);
    
        return res.status(200).json(
            new ApiResponse(200, "", "tweet deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, "something went wrong while delete tweet");
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}