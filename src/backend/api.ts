import express from 'express';
import { Request, Response } from 'express';
import { Library, Book, User } from '../protocol';
import { db, BookRecord } from './db.js';
import { getAuthenticatedUser } from './auth.js';

export const router = express.Router();
router.use(express.json());

router.get('/library', (req: Request, res: Response) => {
  const result: Library = {};
  result.user = getAuthenticatedUser(req);
  result.books = db.getBooks()
    .map((record) => toBook(record, result.user !== undefined));
  res.json(result);
});

function toBook(row: BookRecord, isAuthenticated: boolean): Book {
  const now = Date.now() / 1000;
  return {
    id: row.id,
    description: row.description,
    shelf: db.getShelf(row),
    comment: isAuthenticated ? row.comment : "",
    dueDate: row.dueDate
  };
}

function fromBook(data: Book): BookRecord {
  return {
    id: data.id,
    description: data.description,
    comment: data.comment,
    dueDate: data.dueDate
  };
}

router.post('/update', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user === undefined) {
    res.sendStatus(401);
    return;
  }
  const data = req.body as Book;
  const result = db.upsertBook(fromBook(data), data.shelf);
  res.json(toBook(result, true));
});
