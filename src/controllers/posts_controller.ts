import Post, {iPost} from "../models/posts_model"
import { Request,Response} from 'express';
import BaseController from "./base_controller";


class PostController extends BaseController<iPost> {
    constructor() {
        super(Post);// Pass the model to the base controller
    }

    async create (req:Request, res:Response) {
        const userId = req.params.userId;
        const post = {
            ...req.body, 
            owner: userId // Add the owner field to the post
        }
        req.body = post;
        super.create(req,res);
    };
}

export default new PostController();