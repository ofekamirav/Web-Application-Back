import express from "express";
const router = express.Router();
import commentsController from "../controllers/comments_controller"
import { authMiddleware } from "../controllers/auth_controller";

router.get("/", (req, res) => {
    commentsController.getAll.bind(commentsController)(req, res);
});

router.post("/", authMiddleware, commentsController.create.bind(commentsController));

router.get("/:id", (req, res) => {
    commentsController.getById.bind(commentsController)(req, res);
});

router.put("/:id", authMiddleware, (req, res) => {
    commentsController.updateById.bind(commentsController)(req, res);
});

router.delete("/:id", authMiddleware, (req, res) => {
    commentsController.deleteById.bind(commentsController)(req, res);
});

export default router;
