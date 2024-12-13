import { Request,Response} from 'express';
import { Model } from 'mongoose';

class BaseController<T> {
    model: Model<T>;
    constructor(model: Model<T>) { 
        this.model = model;
    }

    async getAll (req:Request, res:Response) {
        const ownerilter = req.query.owner;
        try {
            if(ownerilter){
                const posts = await this.model.find({owner: ownerilter});
                res.status(200).json(posts);
                if(posts==null)
                    return res.status(404).json({message:'No posts found'});
                return res.status(200).json(posts);
            }
            else{
                const posts = await this.model.find();
                return res.status(200).send(posts);
            }
        } catch(error){
            console.log(error);
            res.status(400).send(error);
        }
    };

    async create (req:Request, res:Response) {
    console.log(req.body);
    try{
        const post = await this.model.create(req.body);
        res.status(201).send(post);
    } catch(err) {
        res.status(400);
        res.send(err);
    }
    };

    //Handler to get a specific post by id
    async getById (req:Request,res:Response){
        const id= req.params.id;
        try{
            const post=await this.model.findById(id);
            console.log(post); 
            if(post==null)
                return res.status(404).json({message:'Post not found'});
            return res.status(200).json(post);
        }
        catch(error){
            return res.status(500).send(error);   
        }
    };
}

const createController = <T> (model: Model<T>) => {
    return new BaseController(model);
}

export default createController;
    
