import { NextFunction, Request, Response } from 'express';
import UserModel, { iUser } from "../models/users_model"; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import cloudinary from '../config/cloudinary';

const generateTokens = (_id: string): { accessToken: string, refreshToken: string } | null => {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
        console.error("FATAL ERROR: Token secrets are not defined in .env file.");
        return null;
    }

    const accessToken = jwt.sign(
        { _id }, 
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m' }
    );

    const refreshToken = jwt.sign(
        { _id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d' }
    ); 

    return { accessToken, refreshToken };
}


async function register(req: Request, res: Response): Promise<void> {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        if (req.file) fs.unlinkSync(req.file.path); 
        res.status(400).send({ message: 'Name, email, and password are required.' });
        return;
    }
    
    if (password.length < 6) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).send({ message: 'Password must be at least 6 characters long.' });
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).send({ message: 'Invalid email format.' });
        return;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).send({ message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
        return; 
    }

    try {
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            if (req.file) fs.unlinkSync(req.file.path); 
            res.status(409).send({ message: 'Email already in use.' });
            return;
        }

        let profilePictureUrl = "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"; // URL ברירת מחדל

        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'profile_pictures',
                    resource_type: 'image',
                });
                profilePictureUrl = result.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary upload failed:", uploadError);
            } finally {
                fs.unlinkSync(req.file.path);
            }
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new UserModel({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            profilePicture: profilePictureUrl, 
            provider: 'Regular'
        });
        
        await newUser.save();

        const tokens = generateTokens(newUser._id.toString());
        if (!tokens) {
            res.status(500).send({ message: 'Could not generate tokens due to server configuration error.' });
            return;
        }

        newUser.refreshTokens = (newUser.refreshTokens || []).filter(token => {
        try {
            jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
            return true;
        } catch {
            return false;
        }
        });

        if (newUser.refreshTokens.length >= 5) {
        newUser.refreshTokens.shift();
        }

        newUser.refreshTokens.push(tokens.refreshToken);
        await newUser.save();

        res.status(201).send({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
                provider: newUser.provider
            }
        });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send({ message: 'An internal server error occurred.' });
    }
}



async function login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).send({ message: 'Email and password are required.' });
        return;
    }

    try {
        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).send({ message: 'Invalid credentials.' });
            return;
        }

        if (user.provider === 'Google' && !user.password) {
            res.status(400).send({ message: 'This account was created with Google. Please use Google login.' });
            return;
        }

        if (!user.password) {
            res.status(401).send({ message: 'Invalid credentials.' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).send({ message: 'Invalid credentials.' });
            return;
        }

        const tokens = generateTokens(user._id.toString());
        if (!tokens) {
            res.status(500).send({ message: 'Could not generate tokens due to server configuration error.' });
            return;
        }

        user.refreshTokens = (user.refreshTokens || []).filter(token => {
        try {
            jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
            return true;
        } catch {
            return false;
        }
        });

        if (user.refreshTokens.length >= 5) {
        user.refreshTokens.shift();
        }

        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.status(200).send({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                provider: user.provider
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send({ message: 'An internal server error occurred.' });
    }
}

const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(401).send({ message: 'Refresh token is required.' });
        return;
    }
    if (!process.env.REFRESH_TOKEN_SECRET) {
        res.status(500).send({ message: 'Server configuration error.' });
        return;
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET) as { _id: string };
        const userId = payload._id;

        const user = await UserModel.findById(userId);
        if (!user || !user.refreshTokens?.includes(refreshToken)) {
            if (user) {
                user.refreshTokens = [];
                await user.save();
            }
            res.status(403).send({ message: 'Invalid refresh token. Please log in again.' });
            return;
        }

        const newTokens = generateTokens(userId);
        if (!newTokens) {
            res.status(500).send({ message: 'Could not generate tokens due to server configuration error.' });
            return;
        }

        user.refreshTokens = (user.refreshTokens || []).filter(token => {
        try {
            jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
            return true;
        } catch {
            return false;
        }
        });

        if (user.refreshTokens.length >= 5) {
        user.refreshTokens.shift();
        }

        user.refreshTokens.push(newTokens.refreshToken);
        await user.save();


        res.status(200).send({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
        });

    } catch (error) {
        console.error('Error during token refresh:', error);
        res.status(403).send({ message: 'Invalid or expired refresh token. Please log in again.' });
    }
};

const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).send({ message: 'Refresh token is required.' });
        return;
    }
  
    try {
        await UserModel.updateOne(
            { refreshTokens: refreshToken }, 
            { $pull: { refreshTokens: refreshToken } }
        );
        res.status(204).send(); 

    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send({ message: 'An internal server error occurred.' });
    }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) {
        res.status(401).send({ message: 'Access denied. No token provided.' });
        return;
    }
    if (!process.env.ACCESS_TOKEN_SECRET) {
        res.status(500).send({ message: 'Server configuration error.' });
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as { _id: string };
        
        req.user = { _id: payload._id };
        
        next();
    } catch {
        res.status(403).send({ message: 'Invalid or expired token.' });
    }
};

const googleCallback = async (req: Request, res: Response) => {
    try {
        const user = req.user as iUser & { _id: string, save: () => Promise<void> };

        const tokens = generateTokens(user._id.toString());
        if (!tokens) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=token-generation-failed`);
        }

        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        res.redirect(`${clientUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
    
    } catch (error) {
        console.error("Error in google callback:", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=server-error`);
    }
};

const authController = { register, login, refresh, logout, authMiddleware, googleCallback };

export default authController;