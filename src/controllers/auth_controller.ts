import { NextFunction, Request,Response} from 'express';
import  UserModel  from "../models/users_model";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

async function register(req: Request, res: Response) {
    
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    if (!email || !password || !name) {
        return res.status(400).send({ error: 'missing required fields' });
    }
    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ error: 'Email already in use' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await UserModel.create({
            name: name,
            email: email,
            password: hashedPassword,
        }); 
        return res.status(200).send(user);
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(400).send(error);
    }
}

async function login(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
        return res.status(400).send({ error: 'missing required fields' });
    }
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).send({ error: 'Email not registered' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send({ error: 'Wrong email or password' });
        }
        if(!process.env.ACCESS_TOKEN_SECRET){
            return res.status(400).send({ error: 'Missing auth configuration' });
        }

        const accessToken = await jwt.sign(
            { _id: user._id }, 
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.TOKEN_EXPIRATION });

        res.status(200).send({ 
            email: user.email,
            _id: user._id,
            token: accessToken
        });
    } catch (error) {
        res.status(400).send(error);
    }
}
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

const authController = {register, login, authMiddleware};

export default authController;