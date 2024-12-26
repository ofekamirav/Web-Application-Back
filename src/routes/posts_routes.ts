import express, { Request, Response } from 'express';
const router = express.Router();
import postController from "../controllers/posts_controller";
import { authMiddleware } from '../controllers/auth_controller';

router.get('/', async (req, res) => {
    if (req.query.owner) {
        postController.getByOwner.bind(postController)(req, res);
    } else {
        postController.getAll.bind(postController)(req, res);
    }
});

router.post("/", authMiddleware, postController.create.bind(postController));

router.put("/:id", authMiddleware, (req: Request, res: Response) => {
    postController.updateById.bind(postController)(req, res);
});

router.get("/:id", (req: Request, res: Response) => {
    postController.getById.bind(postController)(req, res);
});

router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
    postController.deleteById.bind(postController)(req, res);
});

export default router;

