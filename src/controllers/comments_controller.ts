import { Request, Response } from 'express';
import CommentModel, { iComment } from '../models/comment_model';
import mongoose, { Document } from 'mongoose';
import { BaseController } from './base_controller';

class CommentController extends BaseController<iComment & Document> {
    constructor() {
        super(CommentModel);
    }

    // Get all comments for a specific recipe
    getCommentsForRecipe = (req: Request, res: Response) => {
        if (!req.query.recipe) {
            res.status(400).json({ message: "Recipe ID is required to fetch comments." });
            return;
        }
        super.getAll(req, res, {
            populate: { path: 'author', select: 'name profilePictureUrl' }
        });
    }

    // Create a new comment
    createComment = (req: Request, res: Response) => {
        super.create(req, res, {
            preSave: (data, req) => {
                if (req.user?._id) {
                    return { 
                        ...data,
                        author: new mongoose.Schema.Types.ObjectId(req.user._id) as mongoose.Schema.Types.ObjectId
                    };
                }
                return data;
            }
        });
    }

    // Update a comment
    updateComment = (req: Request, res: Response) => {
        super.update(req, res, {
            checkAuth: (doc, req) => doc.author.toString() === req.user?._id
        });
    }

    // Delete a comment
    deleteComment = (req: Request, res: Response) => {
        super.delete(req, res, {
            checkAuth: (doc, req) => doc.author.toString() === req.user?._id
        });
    }
}

export default new CommentController();
