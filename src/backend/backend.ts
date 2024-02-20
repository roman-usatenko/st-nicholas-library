import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from './db.js';
import { router as apiRouter } from './api.js';
import { router as authRouter, initAuth } from './auth.js';
import dotenv from 'dotenv';

dotenv.config();
await db.load();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = http.createServer(app);

const publicDir = path.join(__dirname, '../../public');
app.use(express.static(publicDir));

app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
initAuth();
app.use('/auth', authRouter);
app.use('/api', apiRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log(`Server is running: http://localhost:${PORT}`);
});