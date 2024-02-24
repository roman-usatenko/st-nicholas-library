import { Storage } from "@google-cloud/storage";

export interface BookRecord {
    id: number;
    description: string;
    comment?: string;
    dueDate?: number;
    lastUpdated?: number;
    lastAdmin?: string;
}

class DB {
    private static readonly BUCKET_NAME = "st-nicholas-library-bucket";
    private static readonly OBJECT_NAME = "library.json";

    private readonly books: Record<number, BookRecord> = {}
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
        const storage = JSON.parse(json.toString()) as BookRecord[];
        storage.forEach((record) => {
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

    public getShelf(book: BookRecord): number {
        return Math.round(book.id / 1000);
    }

    public upsertBook(book: BookRecord, shelf: number, skipSave:boolean = false): BookRecord {
        console.log(`Updating shelf ${shelf} -> ${book.description}`);
        var existing = this.books[book.id];
        if (existing) {
            if (this.getShelf(existing) === shelf) {
                existing.description = book.description;
                existing.comment = book.comment;
                existing.dueDate = book.dueDate;
                existing.lastUpdated = book.lastUpdated;
                existing.lastAdmin = book.lastAdmin;
                if(!skipSave) {
                    this.save();
                }
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
        if(!skipSave) {
            this.save();
        }
        return book;
    }

    public getBooks(): BookRecord[] {
        return Object.values(this.books);
    }

}

export const db = new DB();
