import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../protocol.js';

export const router = express.Router();

export function initAuth() {

    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: process.env.GOOGLE_CALLBACK_URL as string
        },
        function (accessToken, refreshToken, profile, done) {
            const user = { id: profile.id, name: profile.displayName };
            console.log("Logged in", user);
            done(null, user);
        }
    ));

    passport.serializeUser(function (user: any, done) {
        done(null, user);
    });

    passport.deserializeUser(function (id, done) {
        done(null, id as User);
    });

    router.get('/google',
        passport.authenticate('google', { scope: ['profile'] }));

    router.get('/google/callback',
        passport.authenticate('google', { failureRedirect: '/' }),
        function (req, res) {
            res.redirect('/');
        });

    router.get('/logout', function (req, res, next) {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    });
}