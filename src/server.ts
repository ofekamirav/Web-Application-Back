import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import RecipesRoutes from './routes/recipes_routes';
import CommentsRoute from './routes/comments_routes';
import UserRoutes from './routes/users_routes';
import AuthRoute from './routes/auth_routes';
import AiRoute from './routes/ai_routes';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import process from 'process';
import path from 'path';
import fs from 'fs';

dotenv.config();
const app = express();

app.use(cors()); //Enable frontend access
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
app.use('/ai', AiRoute);
app.use('/users', UserRoutes);
app.use('/recipes', RecipesRoutes);
app.use('/comments', CommentsRoute);
app.use('/auth', AuthRoute);

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RecipeHub API',
            version: '1.0.0',
            description: 'REST server including authentication using JWT',
        },
        servers: [{ url: 'http://localhost:' + process.env.PORT, },
        { url: 'https://node01.cs.colman.ac.il:', },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
    },
    apis: ['./src/routes/*.ts'],

};
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const clientDir = process.env.FRONT_DIR || path.join(__dirname, '..', '..', 'front');

if (!fs.existsSync(clientDir)) {
  console.warn('[frontend] Static directory not found:', clientDir);
} else {
  console.log('[frontend] Serving static from:', clientDir);
  app.use(
    express.static(clientDir, {
      index: 'index.html',
      maxAge: '1d',
    })
  );
}

app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/auth') ||
    req.path.startsWith('/recipes') ||
    req.path.startsWith('/comments') ||
    req.path.startsWith('/users') ||
    req.path.startsWith('/ai') ||
    req.path.startsWith('/api-docs')
  ) {
    return next();
  }
  if (!fs.existsSync(path.join(clientDir, 'index.html'))) {
    return res.status(404).send('Frontend not deployed');
  }
  res.sendFile(path.join(clientDir, 'index.html'));
});


const initApp = async () => {
    return new Promise<Express>((resolve, reject) => {
        const db = mongoose.connection;
        db.on("error", (error) => console.error('Connection error:', error));
        db.once("open", () => {
            console.log("Connected to MongoDB");
        });

        if (process.env.DB_CONNECTION == undefined) {
            console.error("DB_CONNECTION is not defined");
            reject();

        } else {
            mongoose.connect(process.env.DB_CONNECTION).then(() => {
                resolve(app);
            }).catch((error) => {
                console.error('Error when trying to connect to the database:', error);
                reject(error);
            });
        }
    });
}
export default initApp;
