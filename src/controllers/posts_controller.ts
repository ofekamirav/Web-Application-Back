import Post, {iPost} from "../models/posts_model"
import { Request,Response} from 'express';
import BaseController from "./base_controller";


class PostController extends BaseController<iPost> {
    constructor() {
        super(Post); // inherit base controller to override create method
    }

    async create (req:Request, res:Response) {
        const userId = req.params.userId; 
        const post = {
            ...req.body, 
            owner: userId // the owner of the post is the user that created 
        }
        req.body = post;
        return super.create(req,res);
    };
}

export default new PostController();