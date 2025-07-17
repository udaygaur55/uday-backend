import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

    const {fullName, email, username, password } = req.body
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


export { registerUser };