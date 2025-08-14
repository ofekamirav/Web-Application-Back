import { Request, Response } from 'express';
import CommentModel, { iComment } from '../models/comment_model';
import { Document, Types } from 'mongoose';
import { BaseController } from './base_controller';

class CommentController extends BaseController<iComment & Document> {
  constructor() {
    super(CommentModel);
  }

  // Get all comments for a specific recipe
  getCommentsForRecipe = (req: Request, res: Response) => {
    const recipe = req.query.recipe as string | undefined;
    if (!recipe) {
      res.status(400).json({ message: 'Recipe ID is required to fetch comments.' });
      return;
    }

    super.getAll(req, res, {
      filter: { recipe },
      populate: { path: 'author', select: 'name profilePicture' },
      mapItem: (doc) => {
        if (!doc) return doc;
        if (doc.author && typeof doc.author === 'object') {
          doc.author = {
            _id: doc.author._id?.toString?.() ?? doc.author._id,
            name: doc.author.name,
            profilePicture: doc.author.profilePicture ?? doc.author.profilePictureUrl ?? null,
          };
        }
        return doc;
      }
    });
  };

  // Create a new comment
  createComment = (req: Request, res: Response) => {
    super.create(req, res, {
      preSave: (data, req) => {
        if (!req.user?._id) return data;

        return {
          ...data,
          author: new Types.ObjectId(req.user._id),
        };
      },
    });
  };

  // Update a comment
  updateComment = (req: Request, res: Response) => {
    super.update(req, res, {
      checkAuth: (doc, req) => doc.author.toString() === req.user?._id,
    });
  };

  // Delete a comment
  deleteComment = (req: Request, res: Response) => {
    super.delete(req, res, {
      checkAuth: (doc, req) => doc.author.toString() === req.user?._id,
    });
  };
}

export default new CommentController();
