import express from 'express';
import recipeController from '../controllers/recipes_controller';
import { authMiddleware } from '../controllers/auth_controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: API for managing recipes
 * 
 * components:
 *   schemas:
 *     RecipeInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - ingredients
 *         - instructions
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the recipe.
 *         description:
 *           type: string
 *           description: A short description of the recipe.
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of ingredients.
 *         instructions:
 *           type: string
 *           description: The cooking instructions.
 *         imageUrl:
 *           type: string
 *           description: URL of an image for the recipe.
 *         location:
 *           type: string
 *           description: The location associated with the recipe (e.g., "Tel Aviv").
 *       example:
 *         title: "Classic Shakshuka"
 *         description: "A delicious and easy-to-make shakshuka."
 *         ingredients: ["2 tbsp olive oil", "1 large onion, chopped"]
 *         instructions: "1. Heat olive oil in a large skillet..."
 *         imageUrl: "https://example.com/shakshuka.jpg"
 *         location: "Jaffa"
 * 
 *     RecipeResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *         instructions:
 *           type: string
 *         imageUrl:
 *           type: string
 *         location:
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
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked the recipe.
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Get all recipes
 *     description: Retrieve a paginated list of all recipes. Can be filtered by any field in the model (e.g., author, location).
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter recipes by the author's ID.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter recipes by location.
 *     responses:
 *       '200':
 *         description: A list of recipes.
 */
router.get('/', recipeController.getAllRecipes);

/**
 * @swagger
 * /recipes/liked:
 *   get:
 *     summary: Get recipes liked by the user
 *     description: Retrieves a list of all recipes that the authenticated user has liked.
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of liked recipes.
 *       '401':
 *         description: Unauthorized.
 */
router.get('/liked', authMiddleware, recipeController.getLikedRecipes);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Get a single recipe by ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A single recipe object.
 *       '404':
 *         description: Recipe not found.
 */
router.get('/:id', recipeController.getRecipeById);

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecipeInput'
 *     responses:
 *       '201':
 *         description: Recipe created successfully.
 *       '401':
 *         description: Unauthorized.
 */
router.post('/', authMiddleware, recipeController.createRecipe);

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Update a recipe
 *     tags: [Recipes]
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
 *             $ref: '#/components/schemas/RecipeInput'
 *     responses:
 *       '200':
 *         description: Recipe updated successfully.
 *       '403':
 *         description: Forbidden (not the author).
 *       '404':
 *         description: Recipe not found.
 */
router.put('/:id', authMiddleware, recipeController.updateRecipe);

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     tags: [Recipes]
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
 *         description: Recipe deleted successfully.
 *       '403':
 *         description: Forbidden (not the author).
 *       '404':
 *         description: Recipe not found.
 */
router.delete('/:id', authMiddleware, recipeController.deleteRecipe);

/**
 * @swagger
 * /recipes/{id}/like:
 *   post:
 *     summary: Toggle like on a recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Like toggled successfully.
 *       '404':
 *         description: Recipe not found.
 */
router.post('/:id/like', authMiddleware, recipeController.toggleLike);

export default router;