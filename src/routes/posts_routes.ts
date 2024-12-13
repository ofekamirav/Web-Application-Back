import express, { Request, Response } from 'express';
const router = express.Router();
import postController from "../controllers/posts_controller";

router.get("/", (req, res) => {
    postController.getAll.bind(postController)(req, res);
})

router.post("/", postController.create.bind(postController));

router.get("/:id", (req: Request, res: Response) => {
    postController.getById(req, res);
});


export default router;
