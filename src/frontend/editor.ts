import $ from 'jquery';
import {Modal} from 'bootstrap';
import {Book, User} from '../protocol.js';
import {DOM} from './dom-elements';
import Cookies from 'js-cookie';

export class Editor {
    private modal: Modal;
    private enabled:boolean = false;
    private book?: Book;
    private saveCallback?: (book: Book) => void;

    constructor() {
        this.modal = new Modal("#editor");
        DOM.btnSave.on("click", this.save.bind(this));
    }

    public enable(user: User) {
        this.enabled = true;
        DOM.btnAddBook.show();
        DOM.btnLogin.hide();
        DOM.btnLogout.show();
        DOM.btnLogout.attr("data-bs-title", "Logout " + user.name);
    }

    public show(book?: Book, saveCallback?:(book: Book) => void) {
        if (!this.enabled) {
            return;
        }
        this.book = book;
        this.saveCallback = saveCallback;
        const title = book ? "Book information" : "Add new book";
        DOM.editorLabel.text(title);
        if (book) {
            DOM.edId.val(book.id);
            DOM.edDescription.val(book.description);
            DOM.edShelf.val(book.shelf);
            DOM.edDueDate.val(book.dueDate ? new Date(book.dueDate * 1000).toISOString().slice(0, 10) : "");
            DOM.edComment.val(book.comment || "");
        } else {
            DOM.edId.val("");
            DOM.edDescription.val("");
            DOM.edDueDate.val("");
            DOM.edComment.val("");
            DOM.edShelf.val("");
            const lastUsedShelf = Cookies.get("lastUsedShelf");
            if(lastUsedShelf) {
                DOM.edShelf.val(lastUsedShelf);
            }
        }
        this.modal.toggle();
        DOM.edDescription.focus();
    }

    public save() {
        if (!this.enabled) {
            return;
        }
        if(!DOM.edDescription.val()) {
            alert("Please provide the book description");
            return;
        }

        var shelf:number | undefined = undefined;
        if(!DOM.edShelf.val()) {
            alert("Please provide the shelf number");
            return;
        } else {
            shelf = parseInt(DOM.edShelf.val() as string);
            if(isNaN(shelf) || shelf < 1 || shelf > 1000) {
                alert("Shelf number must be a number between 1 and 1000");
                return;
            }
        }
        var dueDate: number | undefined = undefined;
        if(DOM.edDueDate.val()) {
            const parsed = Date.parse(DOM.edDueDate.val() as string);
            if(isNaN(parsed)) {
                alert("Please provide the due date in the format YYYY-MM-DD");
                return;
            }
            dueDate = parsed/ 1000;
        }

        const book: Book = {
            id: DOM.edId.val() ? parseInt(DOM.edId.val() as string) : 0,
            description: DOM.edDescription.val() as string,
            comment: DOM.edComment.val() as string,
            shelf: shelf,
            dueDate: dueDate,
        };
        const callback = this.saveCallback;
        const modal = this.modal;
        const lastUsedShelf = DOM.edId.val() ? undefined : shelf;
        $.ajax({
            url: 'api/update',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(book),
            success: function(response) {
                modal.toggle();
                if(callback) {
                    callback(book);
                }
                if(lastUsedShelf) {
                    Cookies.set("lastUsedShelf", lastUsedShelf.toString(), { expires: 36500 });
                }
            },
            error: function(xhr, err, exception?) {
                alert("Error: " + exception);
            }
        });
    }
}