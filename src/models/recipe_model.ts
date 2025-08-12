import mongoose, { ObjectId } from 'mongoose';

export interface iRecipe{
    title: string;
    description: string;
    ingredients: string[];
    instructions: string;
    imageUrl: string;
    author: ObjectId;
    likes: ObjectId[];
    createdAt: Date;
}

const recipeSchema = new mongoose.Schema<iRecipe>({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    ingredients: {
        type: [String],
        required: true,
    },
    instructions: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: 'default-image-url.png',
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const RecipeModel = mongoose.model<iRecipe>('Recipes', recipeSchema);

export default RecipeModel;

