import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { User } from '../protocol.js';
import { db } from './db.js';
import { router as apiRouter } from './api.js';

import dotenv from 'dotenv';
dotenv.config();
await db.load();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = http.createServer(app);

// Serve static files from the "public" directory
const publicDir = path.join(__dirname, '../../public');
app.use(express.static(publicDir));

app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: process.env.GOOGLE_CALLBACK_URL as string
},
  function (accessToken, refreshToken, profile, done) {
    const user = { id: profile.id, name: profile.displayName };
    done(null, user);
  }
));

passport.serializeUser(function (user: any, done) {
  done(null, user);
});

passport.deserializeUser(function (id, done) {
  done(null, id as User);
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  });

app.use('/api', apiRouter);

app.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log(`Server is running: http://localhost:${PORT}`);
});