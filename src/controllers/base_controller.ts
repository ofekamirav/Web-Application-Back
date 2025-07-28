import { Request,Response} from 'express';
import { Model, PopulateOptions,FilterQuery } from 'mongoose';

interface ControllerOptions<T> {
    populate?: PopulateOptions | (PopulateOptions | string)[];
    checkAuth?: (doc: T, req: Request) => boolean;
    preSave?: (data: Partial<T>, req: Request) => Partial<T>;
}

export class BaseController<T> {
    model: Model<T>;
    constructor(model: Model<T>) { 
        this.model = model;
    }

  
    async getAll(req: Request, res: Response, options: ControllerOptions<T> = {}) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const query = { ...req.query };
        delete query.page;
        delete query.limit;

        try {
            let findQuery = this.model.find(query as FilterQuery<T>)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            if (options.populate) {
                findQuery = findQuery.populate(options.populate);
            }

            const items = await findQuery;
            const totalItems = await this.model.countDocuments(query as FilterQuery<T>);

            res.status(200).json({
                data: items,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            });
        } catch (error) {
            console.error(`Error in getAll for ${this.model.modelName}:`, error);
            res.status(500).json({ message: 'Server error.' });
        }
    }



      // Handler to create a new post 
    async create(req: Request, res: Response, options: ControllerOptions<T> = {}) {
        let dataToSave: Partial<T> = req.body;
        
        if (options.preSave) {
            dataToSave = options.preSave(dataToSave, req);
        }

        try {
            const newItem = new this.model(dataToSave);
            await newItem.save();
            
            if (options.populate) {
                const populatedItem = await this.model.findById(newItem._id).populate(options.populate);
                res.status(201).json(populatedItem);
            } else {
                res.status(201).json(newItem);
            }
        } catch (error) {
            console.error(`Error in create for ${this.model.modelName}:`, error);
            res.status(400).json({ message: 'Bad request.', error });
        }
    }

    //Handler to get a specific post by id
   async getById(req: Request, res: Response, options: ControllerOptions<T> = {}) {
        try {
            let findQuery = this.model.findById(req.params.id);

            if (options.populate) {
                findQuery = findQuery.populate(options.populate);
            }

            const item = await findQuery;
            if (!item) {
                return res.status(404).json({ message: `${this.model.modelName} not found.` });
            }
            res.status(200).json(item);
        } catch (error) {
            console.error(`Error in getById for ${this.model.modelName}:`, error);
            res.status(500).json({ message: 'Server error.' });
        }
    }

    //Handler to update a specific post by id
       async update(req: Request, res: Response, options: ControllerOptions<T> = {}) {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: `${this.model.modelName} not found.` });
            }

            if (options.checkAuth && !options.checkAuth(item, req)) {
                return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
            }

            const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.status(200).json(updatedItem);
        } catch (error) {
            console.error(`Error in update for ${this.model.modelName}:`, error);
            res.status(500).json({ message: 'Server error.' });
        }
    }

     async delete(req: Request, res: Response, options: ControllerOptions<T> = {}) {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: `${this.model.modelName} not found.` });
            }

            if (options.checkAuth && !options.checkAuth(item, req)) {
                return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
            }

            await this.model.findByIdAndDelete(req.params.id);
            res.status(204).send();
        } catch (error) {
            console.error(`Error in delete for ${this.model.modelName}:`, error);
            res.status(500).json({ message: 'Server error.' });
        }
    }
};

    
