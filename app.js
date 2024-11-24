const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const PostsRoute=require('./routes/posts_routes');
const CommentsRoute=require('./routes/comments_routes');

// Setup Body-parser to analyze URL
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// import Routes
app.use("/post", PostsRoute);
app.use("/comment", CommentsRoute);



// Connect to MongoDB
mongoose.connect(process.env.DB_CONNECTION)
.then(() => console.log('Connected to Database'))
.catch((error) => {
    console.error('Error when trying to connect to the database:', error);
    process.exit(1);
});

const db = mongoose.connection;
db.on('error', (error) => console.error('Connection error:', error));


try{
// Server Connection
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
}catch(error){
    console.error('Error when trying start the server', error);
}
