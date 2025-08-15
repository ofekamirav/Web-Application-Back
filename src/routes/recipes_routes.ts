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
 *     RecipeResponse:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string }
 *         description: { type: string }
 *         ingredients:
 *           type: array
 *           items: { type: string }
 *         instructions: { type: string }
 *         imageUrl: { type: string }
 *         author:
 *           type: object
 *           properties:
 *             _id: { type: string }
 *             name: { type: string }
 *             profilePicture: { type: string, nullable: true }
 *         likes:
 *           type: array
 *           items: { type: string }
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     RecipeCreateForm:
 *       type: object
 *       required: [title, description, ingredients, instructions]
 *       properties:
 *         title: { type: string }
 *         description: { type: string }
 *         instructions: { type: string }
 *         ingredients:
 *           type: string
 *           description: JSON array string, e.g. '["2 eggs","1 cup flour"]'
 *         image:
 *           type: string
 *           format: binary
 */

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Get all recipes
 *     description: Paginated list; filterable by query (e.g., author)
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: author
 *         schema: { type: string }
 *         description: Filter by author id
 *     responses:
 *       '200':
 *         description: A list of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RecipeResponse' }
 *                 totalPages: { type: integer }
 *                 currentPage: { type: integer }
 */
router.get('/', recipeController.getAllRecipes);

/**
 * @swagger
 * /recipes/mine:
 *   get:
 *     summary: Get recipes of the current authenticated user
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       '200':
 *         description: My recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RecipeResponse' }
 *                 totalPages: { type: integer }
 *                 currentPage: { type: integer }
 *       '401': { description: Unauthorized }
 */
router.get('/mine', authMiddleware, recipeController.getMyRecipes);

/**
 * @swagger
 * /recipes/liked:
 *   get:
 *     summary: Get recipes liked by the current user
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: A list of liked recipes
 */
router.get('/liked', authMiddleware, recipeController.getLikedRecipes);

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a new recipe
 *     description: Send JSON with optional imageUrl obtained from /file
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecipeCreateRequest'
 *     responses:
 *       '201':
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RecipeResponse' }
 *       '401': { description: Unauthorized }
 */
router.post('/', authMiddleware, recipeController.createRecipe);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Get a recipe by id
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Single recipe
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RecipeResponse' }
 *       '404': { description: Not found }
 */
router.get('/:id', recipeController.getRecipeById);

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Update a recipe
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       '200': { description: Recipe updated }
 *       '403': { description: Forbidden }
 *       '404': { description: Not found }
 */
router.put('/:id', authMiddleware, recipeController.updateRecipe);

/**
 * @swagger
 * /recipes/{id}/image:
 *   put:
 *     summary: Update recipe image
 *     description: Replace the recipe image with a URL (upload to /file first)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID (Mongo ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL under /storage/recipes/...
 *     responses:
 *       '200':
 *         description: Recipe image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeResponse'
 *       '400':
 *         description: Validation error or missing imageUrl
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden (not the author)
 *       '404':
 *         description: Recipe not found
 */
router.put('/:id/image', authMiddleware, recipeController.updateRecipeImage);


/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204': { description: Deleted }
 *       '403': { description: Forbidden }
 *       '404': { description: Not found }
 */
router.delete('/:id', authMiddleware, recipeController.deleteRecipe);

/**
 * @swagger
 * /recipes/{id}/like:
 *   post:
 *     summary: Toggle like
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Updated recipe
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RecipeResponse' }
 *       '404': { description: Not found }
 */
router.post('/:id/like', authMiddleware, recipeController.toggleLike);

export default router;
