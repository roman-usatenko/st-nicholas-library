import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../protocol.js';

class DevAuthentication {
    readonly enabled: boolean;
    readonly user: User = { id: "dev", name: "Developer" };
    private authenticated: boolean = false;

    constructor() {
        this.enabled = process.env.DEV_MODE === "true";
        if (this.enabled) {
            console.log("!!! Dev mode authentication enabled");
        }
    }

    setAuthenticated(authenticated: boolean) {
        this.authenticated = authenticated;
    }

    isAuthenticated() {
        return this.enabled && this.authenticated;
    }
}

var devAuthentication: DevAuthentication|undefined = undefined; 

export const router = express.Router();

export function getAuthenticatedUser(req: express.Request): User | undefined {
    if(devAuthentication?.enabled) {
        if (devAuthentication.isAuthenticated()) {
            return devAuthentication.user;
        }
        return undefined;
    }
    if (req.isAuthenticated()) {
        return req.user as User;
    }
    return undefined;
}

export function initAuth() {
    devAuthentication = new DevAuthentication();
    if (devAuthentication.enabled) {
        router.get('/google', function (req, res) {
            devAuthentication?.setAuthenticated(true);
            res.redirect('/');
        });
        router.get('/logout', function (req, res) {
            devAuthentication?.setAuthenticated(false);
            res.redirect('/');
        });
    } else {
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
}