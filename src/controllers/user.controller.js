import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken() 

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while generating referesh and access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // velidation not empty
    // check if user already exists: user email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db  
    // remove password and refresh token field from response
    // check for user creation 
    // return res 

    const {fullName, email, username, password } = req.body;
    // console.log("email", email);

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Please fill in all fields");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    })

    if (existedUser) {
        // console.log("User already exists:", existedUser);
        throw new ApiError( 409, "Username or Email already exists");
    }
    console.log(req.files);

    const avatarLocalPath = Array.isArray(req.files?.avatar) && req.files.avatar.length > 0 ? req.files.avatar[0].path : null;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0].path;
        }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is not allowed");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is not allowed");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Somthin went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered successfully", createdUser)
    );


});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    //username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    
    
    const {email, username, password} = req.body;
    
    if (!username && !email) {
        throw new ApiError(400, "Please enter both username and email");
    }
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    const cookieOptions = {
        httpOnly: true,
        secure: true,
    }
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        200,
        {
            user: loggedInUser,
            accessToken,
            refreshToken
        },
        "User logged in successfully"
    )
})

const logoutUser = asyncHandler(async (req, res) => {
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $set: {
                        refreshToken: undefined
                    }
                },
                {
                    new: true
                }
            )
            const cookieOptions = {
            httpOnly: true,
            secure: true,
        }

        return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            }
    
            const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)
    
            return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed"))
            
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})





export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken
    };