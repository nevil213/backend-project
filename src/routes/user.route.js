import { Router } from "express";
import { changeCurrentPassword, loginUser, logOutUser, refreshAccessToken, registerUser, getCurrentUser, updateUserAvatar, updateAccountDetails, updateUserCoverImage, removeCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        },
    ]
),registerUser)

router.route("/login").post(loginUser)
router.route("/refresh-access-token").post(refreshAccessToken)

// secure routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/get-user").post(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(
    verifyJWT, 
    upload.single("avatar"),
    updateUserAvatar)
router.route("/update-coverimage").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage)
router.route("/delete-coverimage").delete(verifyJWT, removeCoverImage);



export default router;