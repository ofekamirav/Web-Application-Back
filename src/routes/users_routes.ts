import express from 'express';
import multer from 'multer';
import userController from '../controllers/users_controller';
import { authMiddleware } from '../controllers/auth_controller';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: API for managing user profiles
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The logged-in user's profile data
 *       '401':
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, userController.getCurrentUserProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update current user's profile
 *     description: Update name and/or profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New display name (min 2 chars)
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Image file (max 5MB)
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.put('/me', authMiddleware, upload.single('profilePicture'), userController.updateCurrentUserProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Delete current user's account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '204':
 *         description: Account deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Server error
 */
router.delete('/me', authMiddleware, userController.deleteCurrentUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user's public profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (Mongo ObjectId)
 *     responses:
 *       '200':
 *         description: The user's public profile and their recipes
 *       '400':
 *         description: Invalid user ID format
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Server error
 */
router.get('/:id', userController.getUserProfile);


/**
 * @swagger
 * /users/me/password:
 *  put:
 *    summary: Update current user's password
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - oldPassword
 *              - newPassword
 *            properties:
 *              oldPassword:
 *                type: string
 *              newPassword:
 *                type: string
 *    responses:
 *      '200':
 *        description: Password updated successfully
 *      '401':
 *        description: Incorrect old password
 */
router.put('/me/password', authMiddleware, userController.updateCurrentUserPassword);

export default router;