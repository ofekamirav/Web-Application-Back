declare global {
    namespace Express {
        interface User {
            _id: string;
            name?: string;
            email?: string;
            provider?: string;
            profilePicture?: string;
        }
    }
}

export {};