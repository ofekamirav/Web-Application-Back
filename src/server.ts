import express, { Express } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import PostsRoute from './routes/posts_routes'; 
import CommentsRoute from './routes/comments_routes'; 
import AuthRoute from './routes/auth_routes';
const app = express();

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
        console.log('initApp finished');

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true })); 

        app.use('/post', PostsRoute);
        app.use('/comment', CommentsRoute);
        app.use('/auth', AuthRoute); 
        resolve(app);
    }).catch((error) => {
        console.error('Error when trying to connect to the database:', error);
        reject(error);
    });
}
});
}
export default initApp;
