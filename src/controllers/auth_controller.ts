import { NextFunction, Request, Response } from 'express';
import UserModel from "../models/users_model"; 
import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import crypto from 'crypto';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const generateTokens = (_id: string): { accessToken: string; refreshToken: string } | null => {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET as Secret | undefined;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET as Secret | undefined;

  if (!accessSecret || !refreshSecret) {
    console.error("FATAL ERROR: Token secrets are not defined in .env file.");
    return null;
  }

    const accessExp: SignOptions['expiresIn'] =
    (process.env.ACCESS_TOKEN_EXPIRATION ?? '15m') as unknown as SignOptions['expiresIn'];
    const refreshExp: SignOptions['expiresIn'] =
    (process.env.REFRESH_TOKEN_EXPIRATION ?? '7d') as unknown as SignOptions['expiresIn']

  const accessToken = jwt.sign(
    { _id },
    accessSecret,
    { expiresIn: accessExp }
  );

  const refreshToken = jwt.sign(
    { _id },
    refreshSecret,
    {
      expiresIn: refreshExp,
      jwtid: crypto.randomUUID(),
    }
  );

  return { accessToken, refreshToken };
};


async function register(req: Request, res: Response): Promise<void> {
    const { email, password, name, profilePicture } = req.body;

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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new UserModel({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            profilePicture: typeof profilePicture === 'string' && profilePicture.trim() ? profilePicture.trim() : null,
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
            res.status(500).send({ message: 'Could not generate tokens.' });
            return;
        }

        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
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

const googleSignin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      res.status(400).send({ message: 'Missing Google credential.' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    if (!email) {
      res.status(400).send({ message: 'Google token missing email.' });
      return;
    }

    let user = await UserModel.findOne({ email });

    if (user) {
      if (user.provider === 'Regular') {
        res.status(400).send({
          message: 'This email is already registered with password. Please log in with your password.'
        });
        return;
      }
      if (!user.profilePicture && payload?.picture) {
        user.profilePicture = payload.picture;
        await user.save();
      }
    } else {
      user = await UserModel.create({
        name: payload?.name || email.split('@')[0],
        email,
        provider: 'Google',
        profilePicture: payload?.picture,
      });
    }

    const tokens = generateTokens(user._id.toString());
    if (!tokens) {
      res.status(500).send({ message: 'Could not generate tokens.' });
      return;
    }

    user.refreshTokens = (user.refreshTokens || []).filter(token => {
      try { jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string); return true; }
      catch { return false; }
    });
    if (user.refreshTokens.length >= 5) user.refreshTokens.shift();
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
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error('googleSignin error:', err);
    res.status(401).send({ message: 'Invalid Google credential.' });
  }
};

const authController = { register, login, refresh, logout, authMiddleware, googleSignin };

export default authController;