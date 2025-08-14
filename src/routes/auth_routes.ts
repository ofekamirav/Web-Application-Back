import express from "express";
import authController from "../controllers/auth_controller";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The Authentication API
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name: { type: string, minLength: 2, description: The user name }
 *         email: { type: string, format: email, description: The user email }
 *         password:
 *           type: string
 *           minLength: 6
 *           description: The user password (must contain uppercase, lowercase, number, and special character)
 *         profilePicture:
 *           type: string
 *           description: URL to user profile picture (optional)
 *       example:
 *         name: 'John Doe'
 *         email: 'john@example.com'
 *         password: 'MyPassword123!'
 *         location: 'Tel Aviv'
 *         profilePicture: 'https://example.com/profile.jpg'
 *
 *     UserLogin:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email }
 *         password: { type: string }
 *       example:
 *         email: 'john@example.com'
 *         password: 'MyPassword123!'
 *
 *     GoogleSigninRequest:
 *       type: object
 *       required: [credential]
 *       properties:
 *         credential:
 *           type: string
 *           description: Google ID token (from @react-oauth/google)
 *           example: eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken: { type: string, description: JWT access token }
 *         refreshToken: { type: string, description: JWT refresh token }
 *         user:
 *           type: object
 *           properties:
 *             _id: { type: string, example: 60d0fe4f5311236168a109ca }
 *             name: { type: string, example: John Doe }
 *             email: { type: string, example: john@example.com }
 *             profilePicture: { type: string, example: https://example.com/profile.jpg }
 *             provider: { type: string, enum: [Regular, Google], example: Regular }
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken: { type: string, description: The refresh token }
 *
 *     TokenResponse:
 *       type: object
 *       properties:
 *         accessToken: { type: string }
 *         refreshToken: { type: string }
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, password, and an optional profile picture.
 *     tags: [Auth]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, description: The user's full name. }
 *               email: { type: string, format: email, description: The user's email address. }
 *               password: { type: string, format: password, description: The user's password. }
 *               profilePicture: { type: string, format: binary, description: The user's profile picture file (optional). }
 *     responses:
 *       '201': { description: User registered successfully, content: { application/json: { schema: { $ref: '#/components/schemas/AuthResponse' } } } }
 *       '400': { description: Bad request (validation error) }
 *       '409': { description: Email already in use }
 *       '500': { description: Server error }
 */
router.post("/register", upload.single("profilePicture"), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserLogin' }
 *     responses:
 *       '200': { description: Successful login, content: { application/json: { schema: { $ref: '#/components/schemas/AuthResponse' } } } }
 *       '400': { description: Bad request (Google account detected) }
 *       '401': { description: Invalid credentials }
 *       '500': { description: Server error }
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/google-signin:
 *   post:
 *     summary: Sign in with Google (ID token)
 *     description: Verify Google ID token and return your app's JWT tokens + user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GoogleSigninRequest' }
 *     responses:
 *       '200': { description: Successful Google sign-in, content: { application/json: { schema: { $ref: '#/components/schemas/AuthResponse' } } } }
 *       '400': { description: Missing/invalid Google credential or email belongs to Regular account }
 *       '401': { description: Invalid Google credential }
 *       '500': { description: Server error }
 */
router.post("/google-signin", authController.googleSignin);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh tokens
 *     description: Refresh access and refresh tokens using the provided refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefreshTokenRequest' }
 *     responses:
 *       '200': { description: Tokens refreshed successfully, content: { application/json: { schema: { $ref: '#/components/schemas/TokenResponse' } } } }
 *       '401': { description: Refresh token is required }
 *       '403': { description: Invalid refresh token }
 *       '500': { description: Server error }
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and invalidate the refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefreshTokenRequest' }
 *     responses:
 *       '204': { description: Successful logout }
 *       '400': { description: Refresh token is required }
 *       '500': { description: Server error }
 */
router.post("/logout", authController.logout);

export default router;
