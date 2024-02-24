import $ from 'jquery';

export class DOM {
    static readonly catalog = $('#catalog');
    static readonly header = $('#header');
    static readonly search = $('#search');
    static readonly editor = $('#editor');
    static readonly editorLabel = $('#editorLabel');
    static readonly edId = $('#edId');
    static readonly edDescription = $('#edDescription');
    static readonly edShelf = $('#edShelf');
    static readonly edLastUpdated = $('#edLastUpdated');
    static readonly edDueDate = $('#edDueDate');
    static readonly edComment = $('#edComment');
    static readonly btnClearComment = $('#btnClearComment');
    static readonly btnClearDueDate = $('#btnClearDueDate');
    static readonly btnAddBook = $('#btnAddBook');
    static readonly btnSave = $('#btnSave');
    static readonly btnLogin = $('#btnLogin');
    static readonly btnLogout = $('#btnLogout');
    static readonly btnBulkImport = $('#btnBulkImport');
    static readonly edBulkImport = $('#edBulkImport');
    static readonly formBulkImport = $('#formBulkImport');
    static readonly formSingleBook = $('#formSingleBook');
}