import Comment, {iComment} from "../models/comment_model"
import { Request, Response } from 'express';
import BaseController from "./base_controller";

const commentController = new BaseController<iComment>(Comment);

export default commentController;