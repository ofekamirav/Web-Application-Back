import express, { Express } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import RecipesRoutes from './routes/recipes_routes'; 
import CommentsRoute from './routes/comments_routes'; 
import AuthRoute from './routes/auth_routes';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use('/recipes', RecipesRoutes);
app.use('/comments', CommentsRoute);
app.use('/auth', AuthRoute); 

const options ={
    definition:{
        openapi: '3.0.0',
        info:{
            title: 'RecipeHub API',
            version: '1.0.0',
            description: 'REST server including authentication using JWT',
        },
        servers:[{url: 'http://localhost:3000',},],
    },
    apis: ['./src/routes/*.ts'],

};
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


const initApp= async () =>{
    return new Promise<Express>((resolve,reject)=>{
    const db = mongoose.connection;
    db.on("error", (error) => console.error('Connection error:', error));
    db.once("open", () => {
        console.log("Connected to MongoDB");
    });

    if(process.env.DB_CONNECTION==undefined){
        console.error("DB_CONNECTION is not defined");
        reject();

    }else{
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
