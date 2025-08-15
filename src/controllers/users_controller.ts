import { Request, Response } from 'express';
import mongoose from 'mongoose';
import UserModel from '../models/users_model';
import RecipeModel from '../models/recipe_model';
import CommentModel from '../models/comment_model';
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


const isReplicaSetError = (err: unknown): boolean => {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 20;
};

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

//update name / email / profile picture
const updateCurrentUserProfile = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) { res.status(401).json({ message: 'User not authenticated.' }); return; }

    const user = await UserModel.findById(userId);
    if (!user) { res.status(404).json({ message: 'User not found.' }); return; }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
    const emailRaw = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : undefined;
    const profilePicture = typeof req.body?.profilePicture === 'string' ? req.body.profilePicture.trim() : undefined;

    // name
    if (name !== undefined) {
      if (name.length < 2) { res.status(400).json({ message: 'Name must be at least 2 characters long.' }); return; }
      user.name = name;
    }

    // email (Regular only)
    if (emailRaw !== undefined) {
      if (user.provider && user.provider !== 'Regular') {
        res.status(400).json({ message: 'Email cannot be changed for Google accounts.' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailRaw)) {
        res.status(400).json({ message: 'Invalid email format.' });
        return;
      }
      if (emailRaw !== user.email) {
        const taken = await UserModel.exists({ email: emailRaw, _id: { $ne: user._id } });
        if (taken) {
          res.status(409).json({ message: 'Email is already in use.' });
          return;
        }
        user.email = emailRaw;

        // user.refreshTokens = [];
      }
    }

    // profile picture
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture || null;
    }

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      provider: updatedUser.provider,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
};

export const deleteCurrentUser = async (req: AuthReq, res: Response): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  let session: mongoose.ClientSession | null = null;

  const deleteAllForUser = async (sess?: mongoose.ClientSession): Promise<void> => {
    const opts = sess ? { session: sess } : undefined;
    await CommentModel.deleteMany({ author: userId }, opts);
    await RecipeModel.deleteMany({ author: userId }, opts);
    await UserModel.findByIdAndDelete(userId, opts);
  };

  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const user = await UserModel.findById(userId).session(session!);
      if (!user) {
        throw new Error('NOT_FOUND');
      }
      await deleteAllForUser(session!);
    });

    res.status(204).send();
    return;
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (isReplicaSetError(err)) {
      try {
        await deleteAllForUser();
        res.status(204).send();
        return;
      } catch (innerErr) {
        console.error('Error during non-transactional account deletion:', innerErr);
        res.status(500).json({ message: 'Server error during account deletion. Please try again.' });
        return;
      }
    }

    console.error('Error during account deletion:', err);
    res.status(500).json({ message: 'Server error during account deletion. Please try again.' });
  } finally {
    if (session) {
      void session.endSession();
    }
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
