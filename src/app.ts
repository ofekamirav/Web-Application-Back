import initApp from './server';


const port = process.env.PORT || 3000;

// Server Connection
initApp().then((app)=> {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error)=>{
    console.error('Error when trying to start the server:', error);
});
