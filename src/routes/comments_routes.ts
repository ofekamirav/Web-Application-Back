import express from 'express';
import commentController from '../controllers/comments_controller';
import { authMiddleware } from '../controllers/auth_controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API for managing comments on recipes
 * 
 * components:
 *   schemas:
 *     CommentInput:
 *       type: object
 *       required:
 *         - text
 *         - recipe
 *       properties:
 *         text:
 *           type: string
 *           description: The content of the comment.
 *         recipe:
 *           type: string
 *           description: The ID of the recipe this comment belongs to.
 *       example:
 *         text: "This looks delicious! Can't wait to try it."
 *         recipe: "60d0fe4f5311236168a109ca"
 * 
 *     CommentResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         text:
 *           type: string
 *         recipe:
 *           type: string
 *         author:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             profilePictureUrl:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments for a specific recipe
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: recipe
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the recipe to fetch comments for.
 *     responses:
 *       '200':
 *         description: A list of comments for the recipe.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentResponse'
 *       '400':
 *         description: Bad Request (Recipe ID is missing).
 */
router.get('/', commentController.getCommentsForRecipe);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentInput'
 *     responses:
 *       '201':
 *         description: Comment created successfully.
 *       '401':
 *         description: Unauthorized.
 */
router.post('/', authMiddleware, commentController.createComment);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment
 *     description: Update a comment that you authored.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Comment updated successfully.
 *       '403':
 *         description: Forbidden (not the author).
 *       '404':
 *         description: Comment not found.
 */
router.put('/:id', authMiddleware, commentController.updateComment);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Delete a comment that you authored.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Comment deleted successfully.
 *       '403':
 *         description: Forbidden (not the author).
 *       '404':
 *         description: Comment not found.
 */
router.delete('/:id', authMiddleware, commentController.deleteComment);

export default router;