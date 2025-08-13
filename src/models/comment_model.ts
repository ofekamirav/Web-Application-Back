import { Schema, model, Document, Types } from 'mongoose';

export interface iComment extends Document {
    author: Types.ObjectId;     
    recipe: Types.ObjectId;     
    text: string;
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
