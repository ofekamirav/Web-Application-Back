import Comment, {iComment} from "../models/comment_model"
import { Request, Response } from 'express';
import createController from "./base_controller";

const commentController = createController(Comment);

export default commentController;