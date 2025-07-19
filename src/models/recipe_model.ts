import mongoose, { ObjectId } from 'mongoose';

export interface iRecipe{
    title: string;
    description: string;
    ingredients: string[];
    instructions: string;
    imageUrl: string;
    author: ObjectId;
    location?: string;
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
        ref: 'UserModel',
        required: true,
    },
    location: {
        type: String,
        trim: true,
        required: false,
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const RecipeModel = mongoose.model<iRecipe>('Recipes', recipeSchema);

export default RecipeModel;

