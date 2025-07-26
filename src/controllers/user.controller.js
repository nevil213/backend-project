import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs"

const generateAccessAndRefreshToken = async (userid) => {
    try {
            const user = await User.findById(userid);
            
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();
            
            user.refreshToken = refreshToken;
            
            await user.save({ validateBeforeSave: false });
            
            return { accessToken, refreshToken }
            
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generatin access token and refresh token")
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

    const { username, email, password } = req.body;

    if(!username || !email){
        throw new ApiError(400, "username or email required");
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

    await generateAccessAndRefreshToken(user._id);

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


export { registerUser, loginUser, logOutUser };