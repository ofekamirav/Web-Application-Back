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
        profilePicture: {
            type: String, 
            default: 'default-profile-picture.png' 
        },
        refreshTokens: {
            type: [String],
            default: []
        }   
    }, { timestamps: true }); 

const User = mongoose.model('Users', userSchema);

export default User;