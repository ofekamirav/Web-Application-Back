import Comment, {iComment} from "../models/comment_model"
import BaseController from "./base_controller";

const commentController = new BaseController<iComment>(Comment);

export default commentController;