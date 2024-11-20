const express = require('express');
const app = express();
const dotenv=require('dotenv').config();
const port =process.env.PORT;
//mongoose decleration


//**Import routes */

//Setup Body-parser to analyzing URL
app.use(express.json());
app.use(express.urlencoded({extended:false}));


try{
    /*mongoose connect
//
//
//
*/
    //Server Connection
    app.listen()(port,()=>console.log(`Server is running on port ${port}`));
}
catch(error){
    console.log('Error when trying to start the server:',error);
}