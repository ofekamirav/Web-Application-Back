import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    post_id: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
const Comment = mongoose.model('Comments', commentSchema);

export default Comment;
