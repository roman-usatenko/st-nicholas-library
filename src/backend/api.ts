import express from 'express';
import multer from 'multer';
import { PassThrough } from 'stream';
import readline from 'readline';
import { Request, Response } from 'express';
import { Library, Book, User } from '../protocol';
import { db } from './db.js';
import { getAuthenticatedUser } from './auth.js';

export const router = express.Router();
router.use(express.json());
const upload = multer();

router.get('/library', (req: Request, res: Response) => {
  const result: Library = {};
  result.user = getAuthenticatedUser(req);
  result.books = db.getBooks();
  if (!result.user) {
    result.books.forEach(stripSensitiveData);
  }
  if ('csv' in req.query) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="library.csv"');
    var csv = "";
    result.books.forEach(book => {
      csv += `#${book.id},${book.description}\n`;
    });
    res.send(csv);
  } else {
    res.json(result);
  }
});

router.post('/update', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user === undefined) {
    res.sendStatus(401);
    return;
  }
  const book = req.body as Book;
  if (!book) {
    res.sendStatus(400);
    return;
  }
  setLastUpdated(book, user);
  const result = db.upsertBook(book);
  res.json(result);
});

router.delete('/delete/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user === undefined) {
    res.sendStatus(401);
    return;
  }
  console.log("Delete request from " + user.name);
  const id = req.params.id as unknown as number;
  db.deleteBook(id);
  res.sendStatus(200);
});

router.post('/bulk-import', upload.single('file'), (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user === undefined) {
    res.sendStatus(401);
    return;
  }
  console.log("Bulk import request from " + user.name);
  if (req.file === undefined) {
    res.sendStatus(400);
    return;
  }
  const bufferStream = new PassThrough();
  bufferStream.end(req.file.buffer);

  var inserted = false;
  console.log("Importing books:");
  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity
  });
  rl.on('line', (line: string) => {
    const book = parseBookLine(line);
    if (book) {
      setLastUpdated(book, user);
      db.upsertBook(book, true);
      inserted = true;
    }
  });
  rl.on('close', () => {
    if (inserted) {
      db.save();
    }
    res.sendStatus(200);
    console.log("Import complete");
  });
});

function setLastUpdated(book: Book, user: User) {
  book.lastUpdated = Date.now();
  book.lastAdmin = user.name;
}

function stripSensitiveData(book: Book) {
  book.comment = "";
  book.lastUpdated = 0;
  book.lastAdmin = "";
}

function parseBookLine(data: string): Book | undefined {
  data = data.trim();
  if (data.startsWith("//")) {
    console.log("Skipping comment: " + data);
    return undefined;
  }
  var idx = data.indexOf(',');
  if (idx < 1 || idx >= data.length - 1) {
    console.log("Skipping invalid line: " + data);
    return undefined;
  }
  const id = data.substring(0, idx).trim();
  if (id.startsWith("#")) {
    const bookId = parseInt(id.substring(1));
    if (isNaN(bookId) || bookId < 1) {
      console.log("Skipping invalid book id: " + data);
      return undefined;
    } else {
      return {
        id: bookId,
        description: data.substring(idx + 1).trim(),
        shelf: Math.round(bookId / 1000)
      };
    }
  }
  const shelf = parseInt(id);
  if (isNaN(shelf) || shelf < 1 || shelf > 1000) {
    console.log("Skipping invalid shelf: " + data);
    return undefined;
  }
  return {
    id: 0,
    description: data.substring(idx + 1).trim(),
    shelf: shelf
  };
}