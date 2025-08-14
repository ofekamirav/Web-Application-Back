import mongoose from "mongoose";

export interface iUser {
    _id?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    provider?: string; // 'Google', 'Regular'
    profilePicture?: string;
    refreshTokens?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true,
            trim: true
        },
        email: { type: String, required: true, lowercase: true, trim: true },
        password: { 
            type: String, 
            required: function(this: mongoose.Document & iUser) {
                return this.provider !== 'Google';
            }
        },
        profilePicture: {
            type: String, 
            default: 'default-profile-picture.png' 
        },
        provider: {
            type: String, 
            enum: ['Regular', 'Google'],
            default: 'Regular'
        },
        refreshTokens: {
            type: [String],
            default: []
        }   
    }, 
    { 
        timestamps: true,
        collection: 'users'
    }
); 

userSchema.index({ email: 1 }, { unique: true, name: 'email_1' });
userSchema.index({ provider: 1 });

userSchema.pre('save', function (next) {
  if (this.isModified('email') && typeof this.email === 'string') {
    this.email = this.email.toLowerCase();
  }
  next();
});

const User = mongoose.model<iUser>('User', userSchema);

export default User;