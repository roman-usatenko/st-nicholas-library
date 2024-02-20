import { storage } from "./test-storage";
import { Storage } from "@google-cloud/storage";

export interface BookRecord {
    id: number;
    description: string;
    comment?: string;
    dueDate?: number;
}

class DB {
    private static readonly BUCKET_NAME = "st-nicholas-library-bucket";
    private static readonly OBJECT_NAME = "library.json";

    private readonly books: Record<number, BookRecord> = {}
    private storage = new Storage();

    public async load() {
        console.log("Loading from external storage");
        console.log(process.env['GOOGLE_APPLICATION_CREDENTIALS']);
        const json = await this.storage
            .bucket(DB.BUCKET_NAME)
            .file(DB.OBJECT_NAME)
            .download();
        const storage = JSON.parse(json.toString()) as BookRecord[];
        storage.forEach((record) => {
            this.books[record.id] = record;
        });
    }

    private save() {
        console.log("Saving to external storage");
        const data = Object.values(this.books);
        this.storage
            .bucket(DB.BUCKET_NAME)
            .file(DB.OBJECT_NAME)
            .save(JSON.stringify(data), {
                metadata: {
                    contentType: "application/json",
                },
            });
    }

    public getShelf(book: BookRecord): number {
        return Math.round(book.id / 1000);
    }

    public upsertBook(book: BookRecord, shelf: number): BookRecord {
        var existing = this.books[book.id];
        if (existing) {
            if (this.getShelf(existing) === shelf) {
                existing.description = book.description;
                existing.comment = book.comment;
                existing.dueDate = book.dueDate;
                this.save();
                return existing;
            } else {
                delete this.books[book.id];
            }
        }
        book.id = shelf * 1000;
        while (this.books[book.id]) {
            book.id++;
        }
        this.books[book.id] = book;
        this.save();
        return book;
    }

    public getBooks(): BookRecord[] {
        return Object.values(this.books);
    }

}

export const db = new DB();
