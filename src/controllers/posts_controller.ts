import Post, {iPost} from "../models/posts_model"
import { Request,Response} from 'express';
import createController from "./base_controller";

const postController = createController<iPost>(Post);

export default postController;