import { Request, Response } from 'express';
import RecipeModel, { iRecipe } from '../models/recipe_model';
import { BaseController } from './base_controller';
import mongoose from 'mongoose';


export class RecipeController extends BaseController<iRecipe> {
        constructor() {
        super(RecipeModel); 
    }

    getAllRecipes = (req: Request, res: Response): void => {
        super.getAll(req, res, {
            populate: { path: 'author', select: 'name profilePictureUrl' }
        });
    }

    getRecipeById = (req: Request, res: Response): void => {
        super.getById(req, res, {
            populate: { path: 'author', select: 'name profilePictureUrl' }
        });
    }


    createRecipe = (req: Request, res: Response): void => {
        super.create(req, res, {
            preSave: (data: Partial<iRecipe>, req: Request): Partial<iRecipe> => {
                if (req.user?._id) {
                    return { 
                        ...data, 
                        author: new mongoose.Schema.Types.ObjectId(req.user._id) as mongoose.Schema.Types.ObjectId
                    };
                }
                return data;
            },
            populate: { path: 'author', select: 'name profilePictureUrl' }
        });
    }
    updateRecipe = (req: Request, res: Response): void => {
        super.update(req, res, {
            checkAuth: (doc, req) => doc.author.toString() === req.user?._id
        });
    }

    deleteRecipe = (req: Request, res: Response): void => {
        super.delete(req, res, {
            checkAuth: (doc, req) => doc.author.toString() === req.user?._id
        });
    }

    // Toggles the like status of a recipe for the authenticated user
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

        const userIdString = userId.toString();
        const hasLiked = recipe.likes?.some(likeId => likeId.toString() === userIdString) || false;

        const updatedRecipe = await this.model.findByIdAndUpdate(
            id,
            hasLiked 
                ? { $pull: { likes: userId } }  
                : { $addToSet: { likes: userId } }, 
            { new: true }
        ).populate({ path: 'author', select: 'name profilePictureUrl' });

        res.status(200).json(updatedRecipe);
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Server error.' });
    }
}

    // Retrieves all recipes liked by the authenticated user
    getLikedRecipes = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated.' });
            return;
        }

        try {
            req.query.likes = userId.toString(); 
            super.getAll(req, res, {
                populate: { path: 'author', select: 'name profilePictureUrl' }
            });
        } catch (error) {
            console.error('Error fetching liked recipes:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    }
}

const recipeController = new RecipeController();
export default recipeController;