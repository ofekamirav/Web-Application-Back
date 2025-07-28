import express from "express";
import authController from "../controllers/auth_controller";
import passport from 'passport';
import multer from 'multer'; 
const upload = multer({ dest: 'uploads/' });


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The Authentication API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: The user name
 *           minLength: 2
 *         email:
 *           type: string
 *           format: email
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password (must contain uppercase, lowercase, number, and special character)
 *           minLength: 6
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
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password
 *       example:
 *         email: 'john@example.com'
 *         password: 'MyPassword123!'
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT access token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d0fe4f5311236168a109ca
 *             name:
 *               type: string
 *               example: John Doe
 *             email:
 *               type: string
 *               example: john@example.com
 *             profilePicture:
 *               type: string
 *               example: https://example.com/profile.jpg
 *             provider:
 *               type: string
 *               enum: [Regular, Google]
 *               example: Regular
 * 
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: The refresh token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 *     TokenResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, password, and an optional profile picture.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data: # 3. שינוי סוג התוכן ל-multipart/form-data
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's full name.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password.
 *               profilePicture: # הוספת השדה לקובץ
 *                 type: string
 *                 format: binary
 *                 description: The user's profile picture file (optional).
 *     responses:
 *       '201':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       '400':
 *         description: Bad request (validation error)
 *       '409':
 *         description: Email already in use
 *       '500':
 *         description: Server error
 */
router.post("/register", upload.single('profilePicture'), authController.register);

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
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       '200':
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       '400':
 *         description: Bad request (Google account detected)
 *       '401':
 *         description: Invalid credentials
 *       '500':
 *         description: Server error
 */
router.post("/login", authController.login);

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
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       '200':
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       '401':
 *         description: Refresh token is required
 *       '403':
 *         description: Invalid refresh token
 *       '500':
 *         description: Server error
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
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       '204':
 *         description: Successful logout
 *       '400':
 *         description: Refresh token is required
 *       '500':
 *         description: Server error
 */
router.post("/logout", authController.logout);


/**
 * @swagger
 * /auth/google:
 * get:
 * summary: Initiate Google OAuth login
 * tags: [Auth]
 * description: Redirects the user to Google's authentication page.
 * responses:
 * '302':
 * description: Redirect to Google's consent screen.
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));



/**
 * @swagger
 * /auth/google/callback:
 * get:
 * summary: Google OAuth callback URL
 * tags: [Auth]
 * description: Google redirects to this URL after user consent. This endpoint handles the user login/registration, generates JWT tokens, and redirects back to the frontend.
 * responses:
 * '302':
 * description: Redirect to the frontend application with tokens in the URL query.
 */
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google-auth-failed` }),
    
    authController.googleCallback
);

export default router;