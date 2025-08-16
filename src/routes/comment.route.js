import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware";
import { addComment, deleteComment, updateComment } from "../controllers/comment.controller";


const router = Router();


router.use(verifyJWT);

router.route("/add-comment/:videoId").post(addComment);
router.route("/update-comment/:commentId").put(updateComment);
router.route("delete-comment/:commentId").delete(deleteComment);

export default router;