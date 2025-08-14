import initApp from './server';
import https from 'https';
import fs from 'fs';

const port = process.env.PORT || 3000;

const tmpFunc = async () => {
    const app = await initApp();
    if (process.env.NODE_ENV != 'production') {
        // Development
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } else {
        // Production 
        const prop = {
            key: fs.readFileSync("../client-key.pem"),
            cert: fs.readFileSync("../client-cert.pem"),
        };
        https.createServer(prop, app).listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
};

tmpFunc();