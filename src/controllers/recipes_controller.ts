/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import RecipeModel, { iRecipe } from '../models/recipe_model';
import { BaseController } from './base_controller';
import { Types } from 'mongoose';
import cloudinary from '../config/cloudinary';

function mapAuthorProfilePicture(doc: any) {
  if (!doc) return doc;
  const a = doc.author as any;
  if (a && typeof a === 'object') {
    doc.author = {
      _id: a._id?.toString?.() ?? a._id,
      name: a.name,
      profilePictureUrl: a.profilePicture ?? null,
    };
  }
  return doc;
}

export class RecipeController extends BaseController<iRecipe> {
  constructor() {
    super(RecipeModel);
  }

   getAllRecipes = (req: Request, res: Response): void => {
    console.log('Fetching all recipes');
    const q = req.query as Record<string, any>;
    if (typeof q.title === "string") {
      const t = q.title.trim();
      if (t) {
        q.title = { $regex: t, $options: "i" };
      } else {
        delete q.title;
      }
    }
    if (q.author && Types.ObjectId.isValid(q.author)) {
        (req.query as Record<string, unknown>).author = new Types.ObjectId(q.author);
    }
    super.getAll(req, res, {
      populate: { path: 'author', select: 'name profilePicture' },
      mapItem: mapAuthorProfilePicture,
    });
  };

  getMyRecipes = (req: Request, res: Response): void => {
    console.log('Fetching my recipes');
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }
    (req.query as Record<string, unknown>).author = new Types.ObjectId(userId);
    super.getAll(req, res, {
      populate: { path: 'author', select: 'name profilePicture' },
      mapItem: mapAuthorProfilePicture,
    });
  };

  getRecipeById = (req: Request, res: Response): void => {
    super.getById(req, res, {
      populate: { path: 'author', select: 'name profilePicture' },
      mapItem: (it) => mapAuthorProfilePicture(it),
    });
  };

   createRecipe = async (req: Request, res: Response): Promise<void> => {
        try {
            const { title, description, instructions, ingredients } = req.body;
            let imageUrl = 'https://placehold.co/600x400/a7f3d0/333?text=Recipe'; 
            
             console.log('createRecipe fields:', {
              hasFile: !!req.file,
              mimetype: req.file?.mimetype,
              size: req.file?.size,
              title, description, instructions,
            });

            try {
              if (req.file) {
                const b64 = Buffer.from(req.file.buffer).toString("base64");
                const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
                const result = await cloudinary.uploader.upload(dataURI, {
                  folder: 'recipehub/recipes',
                  resource_type: 'image',
                });
                imageUrl = result.secure_url;
                console.log('[recipes] cloudinary ok ->', imageUrl);
              }

            } catch (e) {
              console.error('[recipes] cloudinary error:', e);
              res.status(500).json({ message: 'Cloudinary upload failed.' });
              return;
            }

            let ingredientsArr: string[] = [];
            try {
                ingredientsArr = JSON.parse(ingredients);
                if (!Array.isArray(ingredientsArr)) throw new Error();
            } catch {
                res.status(400).json({ message: 'Invalid ingredients format.' });
                return;
            }
             const userId = req.user?._id?.toString();
            if (!userId) {
                res.status(401).json({ message: 'User not authenticated.' });
                return;
            }

            const recipeData = {
                title,
                description,
                instructions,
                imageUrl,
                ingredients: ingredientsArr,
                author: new Types.ObjectId(userId),
            };

            const newRecipe = new this.model(recipeData);
            await newRecipe.save();
            
            const populatedRecipe = await this.model.findById(newRecipe._id)
                .populate({ path: 'author', select: 'name profilePicture' });

            res.status(201).json(populatedRecipe);
        } catch (error) {
            console.error('Error creating recipe:', error);
            res.status(500).json({ message: 'Server error while creating recipe.' });
        }
    };

  updateRecipe = (req: Request, res: Response): void => {
    super.update(req, res, {
      checkAuth: (doc: any, req) => doc.author?.toString() === req.user?._id,
    });
  };

  deleteRecipe = (req: Request, res: Response): void => {
    super.delete(req, res, {
      checkAuth: (doc: any, req) => doc.author?.toString() === req.user?._id,
    });
  };

  toggleLike = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    try {
      const recipe = await this.model.findById(id);
      if (!recipe) {
        res.status(404).json({ message: 'Recipe not found.' });
        return;
      }

      const uid = userId.toString();
      const hasLiked = recipe.likes?.some((x: any) => x.toString() === uid) ?? false;

      const updated = await this.model
        .findByIdAndUpdate(
          id,
          hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
          { new: true }
        )
        .populate({ path: 'author', select: 'name profilePicture' })
        .lean();

      res.status(200).json(mapAuthorProfilePicture(updated));
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  };

  getLikedRecipes = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    try {
      req.query.likes = userId.toString();
      super.getAll(req, res, {
        populate: { path: 'author', select: 'name profilePicture' },
        mapItems: (items) => items.map((it) => mapAuthorProfilePicture(it)),
      });
    } catch (error) {
      console.error('Error fetching liked recipes:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  };
}

const recipeController = new RecipeController();
export default recipeController;
