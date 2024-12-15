import { Request,Response} from 'express';
import  UserModel  from "../models/users_model";
import bcrypt from 'bcrypt';

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
        res.status(201).send({ user });
    } catch (error) {
        res.status(400).send(error);
    }
}

const authController = {register};

export default authController;