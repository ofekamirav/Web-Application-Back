declare namespace Express {
  export interface Request {
    file?: Multer.File; 
    user?: { _id: string }; 
  }
}