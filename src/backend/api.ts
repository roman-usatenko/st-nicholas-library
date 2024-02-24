import express from 'express';
import multer from 'multer';
import { PassThrough } from 'stream';
import readline from 'readline';
import { Request, Response } from 'express';
import { Library, Book, User } from '../protocol';
import { db, BookRecord } from './db.js';
import { getAuthenticatedUser } from './auth.js';

export const router = express.Router();
router.use(express.json());
const upload = multer();

router.get('/library', (req: Request, res: Response) => {
  const result: Library = {};
  result.user = getAuthenticatedUser(req);
  result.books = db.getBooks()
    .map((record) => toBook(record, result.user !== undefined));
  res.json(result);
});

router.post('/update', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user === undefined) {
    res.sendStatus(401);
    return;
  }
  console.log("Update request from " + user.name);
  const data = req.body as Book;
  const result = db.upsertBook(toBookRecord(data, user), data.shelf);
  res.json(toBook(result, true));
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
    const location = toBookLocation(line, user);
    if (location) {
      db.upsertBook(location.book, location.shelf, true);
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


function toBook(record: BookRecord, isAuthenticated: boolean): Book {
  return {
    id: record.id,
    description: record.description,
    shelf: db.getShelf(record),
    comment: isAuthenticated ? record.comment : "",
    dueDate: record.dueDate,
    lastUpdated: isAuthenticated ? record.lastUpdated : 0,
    lastAdmin: isAuthenticated ? record.lastAdmin : ""
  };
}

function toBookRecord(data: Book, user: User): BookRecord {
  return {
    id: data.id,
    description: data.description,
    comment: data.comment,
    dueDate: data.dueDate,
    lastUpdated: Date.now(),
    lastAdmin: user.name
  };
}

interface BookLocation {
  book: BookRecord;
  shelf: number;
}

function toBookLocation(data: string, user: User): BookLocation | undefined {
  data = data.trim();
  if (data.startsWith("#")) {
    return undefined;
  }
  var idx = data.indexOf(',');
  if (idx < 1 || idx >= data.length - 1) {
    return undefined;
  }
  const shelf = parseInt(data.substring(0, idx).trim());
  if (isNaN(shelf)) {
    return undefined;
  }
  const description = data.substring(idx + 1).trim();
  return {
    book: {
      description,
      lastUpdated: Date.now(),
      lastAdmin: user.name,
    } as BookRecord,
    shelf: shelf
  };
}