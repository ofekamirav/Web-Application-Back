import cloudinary from '../config/cloudinary';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserModel from '../models/users_model'; 


passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(new Error('No email in Google profile'), false);

      let user = await UserModel.findOne({ email });

      let finalProfilePic = profile.photos?.[0]?.value;
      if (finalProfilePic) {
        try {
          const up = await cloudinary.uploader.upload(finalProfilePic, {
            folder: 'recipehub/profile_pictures',
            resource_type: 'image',
          });
          finalProfilePic = up.secure_url;
        } catch {
            //if cloudinary upload fails, keep the original Google URL
            finalProfilePic = profile.photos?.[0]?.value;
        }
      }

      if (user) {
        if (user.provider === 'Regular') {
          return done(new Error('This email is already registered. Please log in with your password.'), false);
        }
        if (!user.profilePicture && finalProfilePic) {
          user.profilePicture = finalProfilePic;
          await user.save();
        }
        return done(null, user as Express.User);
      }

      user = await UserModel.create({
        name: profile.displayName || email.split('@')[0],
        email,
        provider: 'Google',
        profilePicture: finalProfilePic,
      });

      return done(null, user as Express.User);
    } catch (err) {
      return done(err as Error, false);
    }
  }
));
