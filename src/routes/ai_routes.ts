import express from 'express';
import aiController from '../controllers/ai_controller';
import { authMiddleware } from '../controllers/auth_controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered recipe suggestions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RecipeSuggestionRequest:
 *       type: object
 *       required:
 *         - ingredients
 *       properties:
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *           description: List of available ingredients
 *           minItems: 1
 *           example: ["chicken breast", "rice", "broccoli", "garlic", "onion"]
 *     
 *     RecipeSuggestionResponse:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The name of the suggested recipe
 *           example: "Garlic Chicken and Broccoli Rice Bowl"
 *         description:
 *           type: string
 *           description: A brief description of the recipe (up to 20 words)
 *           example: "A healthy and flavorful one-bowl meal with tender chicken, steamed broccoli, and aromatic garlic rice."
 *         instructions:
 *           type: string
 *           description: Detailed step-by-step cooking instructions
 *           example: "1. Season chicken breast with salt and pepper, then cut into bite-sized pieces. 2. Heat oil in a large pan over medium-high heat..."
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message describing what went wrong
 *           example: "Ingredients must be a non-empty array."
 */

/**
 * @swagger
 * /ai/suggest-recipe:
 *   post:
 *     summary: Generate AI-powered recipe suggestions
 *     description: Get a personalized recipe suggestion based on your available ingredients using AI technology
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecipeSuggestionRequest'
 *     responses:
 *       '200':
 *         description: Recipe suggestion generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeSuggestionResponse'
 *       '400':
 *         description: Invalid request - ingredients array is missing or empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Ingredients must be a non-empty array."
 *       '401':
 *         description: Authentication required - valid access token must be provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Access denied. No token provided."
 *       '403':
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Invalid or expired token."
 *       '429':
 *         description: Rate limit exceeded - too many requests to AI service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "AI service rate limit exceeded. Please try again later."
 *       '500':
 *         description: Server error - AI service unavailable or configuration issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               ai_config_error:
 *                 summary: AI service not configured
 *                 value:
 *                   message: "AI service is not configured."
 *               ai_service_error:
 *                 summary: AI service error
 *                 value:
 *                   message: "Failed to generate recipe suggestion."
 *               parse_error:
 *                 summary: Response parsing error
 *                 value:
 *                   message: "Failed to parse AI response."
 */
router.post('/suggest-recipe', authMiddleware, aiController.suggestRecipe);

export default router;