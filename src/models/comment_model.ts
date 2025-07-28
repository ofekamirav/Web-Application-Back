import { Schema, model, Document, ObjectId } from 'mongoose';

export interface iComment extends Document {
    text: string;
    author: ObjectId; 
    recipe: ObjectId; 
}

const commentSchema = new Schema<iComment>({
    text: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    recipe: {
        type: Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true,
    },
}, {
    timestamps: true 
});

const CommentModel = model<iComment>('Comments', commentSchema); 

export default CommentModel;
