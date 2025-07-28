import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserModel from '../models/users_model'; 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.SERVER_URL}/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0].value;
        if (!email) {
            return done(new Error('No email found in Google profile'), false);
        }

        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            // If user exists but signed up regularly, return an error
            if (existingUser.provider === 'Regular') {
                const error = new Error('This email is already registered. Please log in with your password.');
                return done(error, false);
            }
            // If user exists with Google provider, proceed with login
            return done(null, existingUser as Express.User);
        } else {
            // If user does not exist, create a new one
            const newUser = new UserModel({
                name: profile.displayName,
                email: email.toLowerCase(),
                provider: 'Google', 
                profilePicture: profile.photos?.[0].value,
            });
            
            await newUser.save();
            return done(null, newUser as Express.User);
        }
    } catch (error) {
        console.error('Error in Google OAuth strategy:', error);
        return done(error as Error, false);
    }
}));
