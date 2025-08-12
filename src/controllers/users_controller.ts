import { Request, Response } from 'express';
import mongoose from 'mongoose';
import UserModel from '../models/users_model';
import RecipeModel from '../models/recipe_model';
import CommentModel from '../models/comment_model';
import cloudinary from '../config/cloudinary';
import bcrypt from 'bcrypt'; 

type AuthReq = Request & {
  user?: { _id: string };
  file?: Express.Multer.File;
};

interface PublicUserProfile {
  _id: string;
  name: string;
  profilePicture?: string;
}

interface UserProfileResponse {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  provider?: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id?: string;
}

//public profile + recipes
const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID format.' });
      return;
    }

    const user = await UserModel.findById(userId).select('name profilePicture');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const recipes = await RecipeModel.find({ author: user._id })
      .populate('author', 'name profilePicture')
      .sort({ createdAt: -1 });

    const userProfile: PublicUserProfile = {
      _id: user._id.toString(),
      name: user.name,
      profilePicture: user.profilePicture,
    };

    res.status(200).json({ user: userProfile, recipes, recipesCount: recipes.length });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error while fetching user profile.' });
  }
};

// current user profile
const getCurrentUserProfile = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const user = await UserModel.findById(userId).select('-password -refreshTokens');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const userProfile: UserProfileResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      provider: user.provider,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
};

//update name and/or profile picture
const updateCurrentUserProfile = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
    if (name !== undefined) {
      if (name.length < 2) {
        res.status(400).json({ message: 'Name must be at least 2 characters long.' });
        return;
      }
      user.name = name;
    }

    // Handle profile picture upload if provided
    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) {
        res.status(400).json({ message: 'Only image files are allowed.' });
        return;
      }
      if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).json({ message: 'File size cannot exceed 5MB.' });
        return;
      }

      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = (await cloudinary.uploader.upload(dataURI, {
          folder: 'recipehub/profile_pictures',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        })) as CloudinaryUploadResult;

        user.profilePicture = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        res.status(500).json({ message: 'Image upload failed. Please try again.' });
        return;
      }
    }

    const updatedUser = await user.save();

    const response: UserProfileResponse = {
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      provider: updatedUser.provider,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
};

//delete account and related data
const deleteCurrentUser = async (req: AuthReq, res: Response): Promise<void> => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const deletedComments = await CommentModel.deleteMany({ author: userId }, { session });
    const deletedRecipes = await RecipeModel.deleteMany({ author: userId }, { session });
    await UserModel.findByIdAndDelete(userId, { session });

    await session.commitTransaction();

    console.log(
      `User ${userId} deleted. Removed ${deletedRecipes.deletedCount} recipes and ${deletedComments.deletedCount} comments.`
    );

    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    console.error('Error during account deletion:', error);
    res.status(500).json({ message: 'Server error during account deletion. Please try again.' });
  } finally {
    session.endSession();
  }
};

const updateCurrentUserPassword = async (req: AuthReq, res: Response): Promise<void> => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!oldPassword || !newPassword) {
        res.status(400).json({ message: 'Old and new passwords are required.' });
        return;
    }

    try {
        const user = await UserModel.findById(userId);
        if (!user || !user.password) { // Check if user has a password (not a Google user)
            res.status(404).json({ message: 'User not found or cannot change password.' });
            return;
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Incorrect old password.' });
            return;
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error while updating password.' });
    }
};

export default {
  getUserProfile,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  deleteCurrentUser,
  updateCurrentUserPassword
};