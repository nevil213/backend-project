import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";
import { deleteCloudinaryImage } from "../utils/deleteCloudinaryImage.js";

const generateAccessAndRefreshToken = async (userid) => {
    try {
            const user = await User.findById(userid);

            // console.log("user from func:", user);
            
            const accessToken = user.generateAccessToken();
            // console.log(accessToken);
            const refreshToken = user.generateRefreshToken();
            
            user.refreshToken = refreshToken;
            
            await user.save({ validateBeforeSave: false });
            
            return { accessToken, refreshToken }
            
    }
    catch (error) {
        // console.log(error);
        throw new ApiError(500, `Something went wrong while generatin access token and refresh token`)
    }
}
    
const registerUser = asyncHandler( async (req, res, next) => {

    /*
        1. use mongodb User model
        2. fill fields of it with this controller
        2.1 assuming all fields coming in req.body with appropriate names
        2.2 extract them with const { username, email .... } = req.body
        2.3 use User model, put it to there and just..
        3. save it


        // take fields from frotend
        // validations - not empty, email formate..
        // check user is exists or not - by username & email
        // check for images & avatars
        // upload them to cloudinary
        // create user object - create entry in db
        // remove password & refreshtoken fields from response
        // check for user creation
        // return response

    */


    try {
   
            const { username, email, fullname, password } = req.body;
            
            // console.log("req.body: ", req.body);
            
            // console.log(username, email, fullname, password);
            
            if(!username || username === ""){
                    throw new ApiError(400, "username should not be empty")
            }
            else if(!email || email === ""){
                    throw new ApiError(400, "email should not be empty")
            }
            else if(!password || password === ""){
                    throw new ApiError(400, "password should not be empty")
            }
            else if(!fullname || fullname === ""){
                    throw new ApiError(400, "full name should not be empty")
            }
                
                // if(
                //     [ username, email, fullname, password ].some((field) => (
                //         field === ""))
                //     ) {
                //         throw new ApiError(400, "All fields are compulsory")
                //     }
                    
                    
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if(!emailRegex.test(email)){
                        throw new ApiError(400, "invalid email format");
                    }
                    
                    
                    const existedUser = await User.findOne({
                        $or: [{ username }, { email }]
                    })
                    
                    if(existedUser){
                        throw new ApiError(409, "user with same username or email already exists")
                    }
                    
                    // const avatarLocalPath = req.files?.avatar[0]?.path;
                    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
                    
                    // console.log("req.files: ", req.files);
                    
                    let avatarLocalPath;
                    
                    if(req.files && Array.isArray(req.files.avatar)){
                        avatarLocalPath = req.files.avatar[0].path;
                    }
                    
                    let coverImageLocalPath;
                    
                    // console.log(req.files?.coverImage[0]?.legth)
                    
                    if(req.files && Array.isArray(req.files.coverImage)){
                        coverImageLocalPath = req.files.coverImage[0].path;
                    }
                    
                    if(!avatarLocalPath) throw new ApiError(400, "avatar file is required");
                    
                    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
                    
                    if(!avatarResponse){
                        throw new ApiError(400, "avatar file is required");
                    }
                    

                    let coverImageResponse;

                    if(coverImageLocalPath){

                        // console.log("coverImageLocalPath: ", coverImageLocalPath)
                        
                        coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
                        
                    }
                    
                    // console.log("coverImageResponse: ", coverImageResponse)
                    
                    const user = await User.create({
                        username: username.toLowerCase(),
                        email: email.toLowerCase(),
                        password,
                        avatar: avatarResponse.url,
                        coverImage: coverImageResponse?.url || "",
                        fullname
                    });
                    
                    // console.log("MONGODB user: ", user);
                    
                    const createdUser = await User.findById(user._id).select("-password -refreashToken");
                    
                    // console.log("MONGODB user after removing password, refresh token: ", createdUser);
                    
                    if(!createdUser){
                        throw new ApiError(500, "Something went wrong while registering the user");
                    }
                    
                    return res.status(201).json(
                        new ApiResponse(200, createdUser, "user registed successfully")
                    )
                
            } catch (error) {
                
                if(req.files && Array.isArray(req.files?.avatar) && fs.existsSync(req.files?.avatar[0]?.path)) fs.unlinkSync(req.files?.avatar[0]?.path);
                if(req.files && Array.isArray(req.files?.coverImage) && fs.existsSync(req.files.coverImage[0]?.path)) fs.unlinkSync(req.files.coverImage[0].path);
                next(error);
            }
        })
            

const loginUser = asyncHandler( async (req, res, next) => {
    // get email/username & password from frontend
    // or get refreshtoken from user
    // compare with the databse with findone
    // password check
    // gen accesstoken & refrshtoken -> send via secure cookie

    // console.log(req.body);

    const { username, email, password } = req.body;


    if((!username && !email)){
        throw new ApiError(400, "either username or email required");
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })
    
    if(!user){
        throw new ApiError(404, "user doesn't exists")
    }
    
    const isAuthorized = await user.isPasswordCorrect(password)
    
    if(!isAuthorized){
        throw new ApiError(401, "invalid user credentials")
    }

    // console.log("user_id: ", user._id)

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    );

})

const logOutUser = asyncHandler( async (req, res, next) => {
    // 1. need _id of user --> via auth middleware
    // 2. delete cookies from browser
    // 3. delete refreshToken from database

    // const user = await User.findById(req.user._id);
    // user.refreshToken = "";

    // await user.save({validateBeforeSave: false});


    // alternative method for find + update
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true  // if we take reference of this to variable, will get new instance of after updation. without this default is old instance one
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
        new ApiResponse(200, "", "user logged out successfully")
    )
})

const refreshAccessToken = asyncHandler ( async (req, res, next) => {
    
    const incomingRefreshToken = req.cookie?.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access");
    }

    try {
        const refreshTokenContent = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(refreshTokenContent?._id);
        
        if(!user){
            throw new ApiError(401, "invalid refresh token");
        }
    
        if(user.refreshToken != incomingRefreshToken){
            throw new ApiError(401, "Refresh token is invalid or used");
        }
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    
        /* // unsafe approch
    
        const userid = req.user._id; //we are not keeping refreshToken inside req.user, becoz its also unsafe
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userid);
        
        */
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "access token refreshed successfully"
            )
        );
    } catch (error) {
        throw new ApiError(401, "invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler ( async (req, res) => {
    
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if(!(oldPassword && newPassword && confirmPassword)){
        throw new ApiError(400, "old password, new password and confirm password are required");
    }

    if(newPassword !== confirmPassword){
        throw new ApiResponse(400, "new password and confirm password should be same");
    }

    const user = await User.findById(req.user?._id);

    // const isAuthorized = await bcrypt.compare(oldPassword, user.password);

    const isAuthorized = await user.isPasswordCorrect(oldPassword)
    
    if(!isAuthorized){
        throw new ApiError(401, "password is not correct");
    }

    user.password = newPassword;

    user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, "", "Password changed successfully")
    )

})

const getCurrentUser = asyncHandler ( async (req, res) => {
    
    // if(!req.user){
    //     throw new ApiError(401, "unauthorized access")
    // }

    return res.status(200).json(
        new ApiResponse(200, req.user, "user fetched successfully")
    );
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const { fullName, email } = req.body;

    if(!(fullName && email)){
        throw new ApiError("all fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    const accessToken = await user.generateAccessToken();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken,
                user
            },
            "Account details updated successfully"
        )
    )

} ) 

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "avatar uploading failed");
    }

    const oldUser = await User.findById(req.user?._id);

    // http://res.cloudinary.com/cac-backend-project/image/upload/v12344/abcd.jpg
    let imagePublicId = oldUser?.avatar.split("/")
    // console.log(imagePublicId);
    // console.log(imagePublicId.length);
    imagePublicId = imagePublicId[imagePublicId.length - 1];
    // console.log(imagePublicId);
    imagePublicId = imagePublicId.split(".")[0];
    // console.log(imagePublicId);

    await deleteCloudinaryImage(imagePublicId)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200, user, "user avatar updated successfully")
    );

});

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Cover Image uploading failed");
    }

    const oldUser = await User.findById(req.user?._id);

    if(oldUser.coverImage){
        
        let imagePublicId = oldUser?.coverImage.split("/");
        imagePublicId = imagePublicId[imagePublicId.length - 1];
        imagePublicId = imagePublicId.split(".");
        imagePublicId = imagePublicId[0];
        
        await deleteCloudinaryImage(imagePublicId);
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    );

});

const removeCoverImage = asyncHandler( async (req, res) => {
    const user = await User.findById(req.user?._id);

    if(user.coverImage){
        try {
                    let imagePublicId = user.coverImage.split("/");
                    imagePublicId = imagePublicId[imagePublicId.length - 1];
                    imagePublicId = imagePublicId.split(".");
                    imagePublicId = imagePublicId[0];
            
                    await deleteCloudinaryImage(imagePublicId);
            
                    user.coverImage = undefined;
            
                    await user.save();
            
                    return res.status(200).json(
                        new ApiResponse(200, "", "cover image removed successfully")
                    );
        } catch (error) {
            throw new ApiError(500, "something went wrong while removing cover image")
        }
    }

    throw new ApiError(404, "cover image is already unset");
})

const getUserProfile = asyncHandler( async (req, res) => {
    const { username } = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "username is required");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404, "channel not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )
})


export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, removeCoverImage };