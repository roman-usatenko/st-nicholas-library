import { Storage } from "@google-cloud/storage";
import { Book } from "../protocol";

class DB {
    private static readonly BUCKET_NAME = "st-nicholas-library-bucket";
    private static readonly OBJECT_NAME = "library.json";

    private readonly books: Record<number, Book> = {}
    private storage = new Storage();

    public async load() {
        console.log("Loading from external storage");
        if(process.env.DEV_MODE === "true") {
            console.log("!!! Dev mode enabled, skipping load");
            return;
        }
        const json = await this.storage
            .bucket(DB.BUCKET_NAME)
            .file(DB.OBJECT_NAME)
            .download();
        const storage = JSON.parse(json.toString()) as Book[];
        storage.forEach((record) => {
            if(!record.shelf) {
                record.shelf = Math.round(record.id / 1000);
            }
            this.books[record.id] = record;
        });
        console.log("Loaded " + Object.keys(this.books).length + " books");
    }

    public save() {
        console.log("Saving to external storage");
        if(process.env.DEV_MODE === "true") {
            console.log("!!! Dev mode enabled, skipping save");
            return;
        }
        const data = Object.values(this.books);
        this.storage
            .bucket(DB.BUCKET_NAME)
            .file(DB.OBJECT_NAME)
            .save(JSON.stringify(data), {
                metadata: {
                    contentType: "application/json",
                },
            }).then(() => {
                console.log("Saved " + data.length + " books");
            }).catch((error) => {
                console.error("Error saving", error);
            });
    }

    public upsertBook(book: Book, bulkImport:boolean = false): Book {
        console.log(`Updating ${JSON.stringify(book)}`);
        var existing = this.books[book.id];
        if (existing) {
            existing.description = book.description || existing.description;
            existing.shelf = bulkImport ? existing.shelf : book.shelf;
            existing.comment = bulkImport ? existing.comment : book.comment;
            existing.dueDate = bulkImport ? existing.dueDate : book.dueDate;
            existing.lastUpdated = book.lastUpdated;
            existing.lastAdmin = book.lastAdmin;
            if(!bulkImport) {
                this.save();
            }
            return existing;
        }
        book.id = (book.shelf || 0) * 1000;
        while (this.books[book.id]) {
            book.id++;
        }
        this.books[book.id] = book;
        if(!bulkImport) {
            this.save();
        }
        return book;
    }

    public getBooks(): Book[] {
        return Object.values(this.books);
    }

    public deleteBook(id: number) {
        const book = this.books[id];
        if(!book) {
            return;
        }
        console.log(`Deleting ${JSON.stringify(book)}`);
        delete this.books[id];
        this.save();
    }
}

export const db = new DB();
