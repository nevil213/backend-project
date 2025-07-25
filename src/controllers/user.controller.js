import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    const { username, email, fullname, password } = req.body;

    // console.log(username, email, fullname, password);

    // if(username === ""){
    //     throw new ApiError(400, "username should not be empty")
    // }

    if(
        [ username, email, fullname, password ].some((field) => (
            field?.some === ""))
    ) {
        throw new ApiError(400, "All fields are compulsory")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "user with same username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) throw new ApiError(400, "avatar file is required");

    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
     
    if(!avatarResponse){
            throw new ApiError(400, "avatar file is required");
    }

    if(coverImageLocalPath){
        const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
    }

    
    const user = await User.create({
        username: username.toLowercase(),
        email: email.toLowercase(),
        password,
        avatar: avatarResponse.url,
        coverImage: coverImageResponse?.url || "",
        fullname
    });

    const createdUser = await User.findById(user._id).select("-password -refreashToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    
    return res.status(201).json(
        new ApiResponse(200, "user registed successfully")
    )

})

export { registerUser };