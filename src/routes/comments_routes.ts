import express from "express";
const router = express.Router();
import commentsController from "../controllers/comments_controller"
import { authMiddleware } from "../controllers/auth_controller";

 /**
 * @swagger
 * tags:
 *  name: Comments
 *  description: The Comments API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - comment
 *         - postId
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the post
 *         comment:
 *           type: string
 *           description: The title of the post
 *         postId:
 *           type: string
 *           description: The content of the post
 *         owner:
 *           type: string
 *           description: The owner id of the post
 *       example:
 *         _id: 245234t234234r234r23g8
 *         comment: My First Comment
 *         postId: 245234t234234r234r23f4
 *         owner: 324vt23r4tr234t245tbv45by
 */


/**
 * @swagger
 * /comment:
 *   get:
 *     summary: Get all comments
 *     description: Retrieve a list of all comments
 *     tags:
 *       - Comments
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */

router.get("/", (req, res) => {
    commentsController.getAll.bind(commentsController)(req, res);
});

/**
 * @swagger
 * /comment:
 *   comment:
 *     summary: Create a new comment
 *     description: Create a new comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: The title of the comment
 *               postId:
 *                 type: string
 *                 description: The post id of the comment
 *             required:
 *               - comment
 *               - postId
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
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
