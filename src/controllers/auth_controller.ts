import { NextFunction, Request,Response} from 'express';
import  UserModel  from "../models/users_model";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

async function register(req: Request, res: Response) {
    
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    if (!email || !password || !name) {
        res.status(400).send({ error: 'missing required fields' });
        return;
    }
    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            res.status(400).send({ error: 'Email already in use' }); 
             return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await UserModel.create({
            name: name,
            email: email,
            password: hashedPassword,
        }); 
        res.status(200).send(user);
        return;
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).send(error);
        return;
    }
}

const generateTokens = (_id: string): { accessToken: string, refreshToken: string } | null => {
    if(!process.env.ACCESS_TOKEN_SECRET){
        return null;
    } 
    const random = Math.floor(Math.random() * 1000000); 
    const accessToken = jwt.sign(
        { 
            _id: _id,
            random: random, 
         }, 
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRATION });
    
    const refreshToken = jwt.sign(
        { 
            _id: _id,
            random: random 
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION });  
    return { accessToken, refreshToken };
}

async function login(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        res.status(400).send({ error: 'missing required fields' });
        return;
    }
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(400).send({ error: 'Email not registered' });
            return;
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(400).send({ error: 'Wrong email or password' });
            return;
        }
        const userId = user._id.toString();
        const tokens = generateTokens(userId);
        if (!tokens) {
            res.status(400).send({ error: 'Missing auth configuration' });
            return;
        }
              
        if (!user.refreshTokens) {
            user.refreshTokens = [];
        }
        user.refreshTokens.push(tokens.refreshToken);;
        await user.save();

        res.status(200).send({ 
            email: user.email,
            _id: user._id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        res.status(400).send(error);
    }
}

const logout = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send({ error: 'missing refresh token' });
        return;
    }
  if (!process.env.ACCESS_TOKEN_SECRET) {
        res.status(400).send({ error: 'Missing auth configuration' });
        return;
    }
    jwt.verify(refreshToken, process.env.ACCESS_TOKEN_SECRET, async (err: any, payload: any) => {
        if (err) {
            res.status(403).send({ error: 'Invalid token' });
            return;
        }
        const userId = (payload as Payload)._id;
        try{
            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                res.status(400).send({ error: 'User not found' });
                return;
            }
            if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                res.status(400).send({ error: 'Invalid refresh token' });
                user.refreshTokens = []; // delete all user tokens 
                await user.save();
                return;
            }
            user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
            await user.save();
            res.status(200).send({ message: 'Logged out' });
        } catch (error) {
            res.status(400).send(error);
        }    
    });
}

const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send({ error: 'missing refresh token' });
        return;
    }
    if (!process.env.ACCESS_TOKEN_SECRET) {
        res.status(400).send({ error: 'Missing auth configuration' });
        return;
    }
    jwt.verify(refreshToken, process.env.ACCESS_TOKEN_SECRET, async (err: any, payload: any) => {
        if (err) {
            res.status(403).send({ error: 'Invalid token' });
            return;
        }
        const userId = (payload as Payload)._id;
        try {
            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                res.status(400).send({ error: 'User not found' });
                return;
            }
            if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                res.status(400).send({ error: 'Invalid refresh token' });
                user.refreshTokens = []; // delete all user tokens
                await user.save();
                return;
            }
            const newTokens = generateTokens(userId.toString());
            if (!newTokens) {
                user.refreshTokens = []; 
                await user.save();
                res.status(400).send({ error: 'Missing auth configuration' });
                return;
            }
            user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken); // delete the old refresh token
            user.refreshTokens.push(newTokens.refreshToken); // save the new refresh token
            await user.save(); 
            res.status(200).send({ 
                email: user.email,
                _id: user._id,
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken
            });
        } catch (error) {
            res.status(400).send(error);
        }
    });
};

type Payload = {
    _id: string
}
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    //  get the authorization header and extract the token from it 
    const authHeader = req.header('authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) { 
        res.status(401).send({ error: 'Access denied' });
        return;
    }
    if(!process.env.ACCESS_TOKEN_SECRET){
        res.status(400).send({ error: 'Missing auth configuration' });
        return;
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
            res.status(403).send({ error: 'Invalid token' });
            return;
        }
        req.params.userId = (payload as Payload)._id; // add the user id to the request
        next();
    });
}

const authController = {register, login, authMiddleware, logout, refresh};

export default authController;