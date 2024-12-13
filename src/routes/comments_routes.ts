import express from "express";
const router = express.Router();
import commentsController from "../controllers/comments_controller"

router.get("/", (req, res) => {
    commentsController.getAll.bind(commentsController)(req, res);
});

router.post("/", commentsController.create.bind(commentsController));

router.get("/:id", (req, res) => {
    commentsController.getById(req, res);
});

export default router;
