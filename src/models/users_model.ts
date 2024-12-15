import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String, 
            required: true 
        },
        password: { 
            type: String, 
            required: true 
        },
        posts: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Post' 
        }],
        comments: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Comment' 
        }],
        tokens: {
            type: [String]
        }
    });

const User = mongoose.model('UserModel', userSchema);

export default User;