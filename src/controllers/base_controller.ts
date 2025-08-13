/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { Model, PopulateOptions, FilterQuery } from 'mongoose';

interface ControllerOptions<T> {
  populate?: PopulateOptions | (PopulateOptions | string)[];
  checkAuth?: (doc: T, req: Request) => boolean;
  preSave?: (data: Partial<T>, req: Request) => Partial<T>;
  mapItems?: (items: any[]) => any[]; 
  mapItem?: (item: any) => any;  
  filter?: FilterQuery<T>;     
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

    const queryFromReq = { ...req.query } as Record<string, unknown>;
    delete queryFromReq.page;
    delete queryFromReq.limit;

    const mergedFilter = { ...(queryFromReq as FilterQuery<T>), ...(options.filter || {}) };

    try {
      let findQuery = this.model
        .find(mergedFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      if (options.populate) findQuery = findQuery.populate(options.populate);

      const rawItems = await findQuery.lean();
      const items = options.mapItems ? options.mapItems(rawItems as unknown[]) : rawItems;

      const totalItems = await this.model.countDocuments(mergedFilter);

      res.status(200).json({
        data: items,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        currentPage: page,
      });
    } catch (error) {
      console.error(`Error in getAll for ${this.model.modelName}:`, error);
      res.status(500).json({ message: 'Server error.' });
    }
  }

  async create(req: Request, res: Response, options: ControllerOptions<T> = {}) {
    let dataToSave: Partial<T> = req.body;

    if (options.preSave) dataToSave = options.preSave(dataToSave, req);

    try {
      const newItem = await this.model.create(dataToSave);
      if (options.populate) {
        const populatedItem = await this.model.findById((newItem as any)._id).populate(options.populate).lean();
        const item = options.mapItem ? options.mapItem(populatedItem) : populatedItem;
        res.status(201).json(item);
      } else {
        const item = options.mapItem ? options.mapItem(newItem) : newItem;
        res.status(201).json(item);
      }
    } catch (error) {
      console.error(`Error in create for ${this.model.modelName}:`, error);
      res.status(400).json({ message: 'Bad request.', error });
    }
  }

  async getById(req: Request, res: Response, options: ControllerOptions<T> = {}) {
    try {
      let findQuery = this.model.findById(req.params.id).lean();
      if (options.populate) findQuery = findQuery.populate(options.populate);

      const raw = await findQuery.lean();
      if (!raw) return res.status(404).json({ message: `${this.model.modelName} not found.` });

      const item = options.mapItem ? options.mapItem(raw) : raw;
      res.status(200).json(item);
    } catch (error) {
      console.error(`Error in getById for ${this.model.modelName}:`, error);
      res.status(500).json({ message: 'Server error.' });
    }
  }

  async update(req: Request, res: Response, options: ControllerOptions<T> = {}) {
    try {
      const existing: any = await this.model.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: `${this.model.modelName} not found.` });

      if (options.checkAuth && !options.checkAuth(existing, req)) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
      }

      const updated = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
      const item = options.mapItem ? options.mapItem(updated) : updated;
      res.status(200).json(item);
    } catch (error) {
      console.error(`Error in update for ${this.model.modelName}:`, error);
      res.status(500).json({ message: 'Server error.' });
    }
  }

  async delete(req: Request, res: Response, options: ControllerOptions<T> = {}) {
    try {
      const existing: any = await this.model.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: `${this.model.modelName} not found.` });

      if (options.checkAuth && !options.checkAuth(existing, req)) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
      }

      await this.model.findByIdAndDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(`Error in delete for ${this.model.modelName}:`, error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
}
