import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import './styles.css';
import { DOM } from './dom-elements';
import { Tooltip } from 'bootstrap';
import { Editor } from './editor';
import { Book } from '../protocol.js';
import 'bootstrap-datepicker'
import 'bootstrap-datepicker/dist/css/bootstrap-datepicker.css';


const AVAILABLE_ICON = "<i class='fas fa-check-square text-success' data-bs-toggle='tooltip' data-bs-title='Available now!'></i>";
const UNAVAILABLE_ICON = "<i class='fas fa-clock text-warning' data-bs-toggle='tooltip' data-bs-title='Should be available later'></i>";
const OVERDUE_ICON = "<i class='fas fa-exclamation-triangle text-danger' data-bs-toggle='tooltip' data-bs-title='Overdue!'></i>";

const editor = new Editor();

$(function () {
    var table = DOM.catalog.DataTable({
        ajax: function (data, callback, settings) {
            $.ajax({
                url: 'api/library',
                method: 'GET',
                dataType: 'json',
                success: function (response) {
                    if (response.user) {
                        editor.enable(response.user);
                    }
                    callback({ data: response.books });
                }
            });
        },
        initComplete: function (settings, json) {
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl));
        },
        columns: [
            { "data": "description" },
            {
                "data": null,
                "render": function (data, type, row) {
                    return "_" + row.shelf + "_";
                }
            },
            {
                "data": null,
                "searchable": false,
                "render": function (data, type, row) {
                    const now = Date.now() / 1000;
                    if (!row.dueDate) {
                        return AVAILABLE_ICON;
                    } else if (row.dueDate < now) {
                        return OVERDUE_ICON + " &nbsp; " +
                            new Date(row.dueDate * 1000).toISOString().slice(0, 10);
                    } else {
                        return UNAVAILABLE_ICON + " &nbsp; " +
                            new Date(row.dueDate * 1000).toISOString().slice(0, 10);
                    }
                }
            }
        ],
        columnDefs: [
            { "className": "text-center", "targets": [1, 2] }

        ],
        scrollY: "70vh",
        scrollCollapse: true,
        paging: false,
        layout: {
            topEnd: 'paging',
            bottomStart: 'paging'
        }
    });

    DOM.search.on('input', function () {
        table.search($(this).val() as string).draw();
    });

    $('#catalog tbody').on('click', 'tr', function () {
        const selector = this;
        var data = table.row(selector).data();
        if(data) {
            editor.show(data as Book, (data) => { table.row(selector).data(data) });
        } else {
            editor.show(undefined, (book) => { table.row.add(book).draw() });
        }
    });

    DOM.edDueDate.datepicker({
        format: 'yyyy-mm-dd'
    });

    DOM.btnClearDueDate.on('click', function () {
        DOM.edDueDate.val("");
    });

    DOM.btnClearComment.on('click', function () {
        DOM.edComment.val("");
    });

    DOM.btnLogin.on('click', function () {
        window.location.href = '/auth/google';
    });

    DOM.btnLogout.on('click', function () {
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }
        window.location.href = '/logout';
    });

    DOM.btnAddBook.on('click', function () {
        editor.show(undefined, (book) => { table.row.add(book).draw() });
    });
});