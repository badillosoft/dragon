namespace("dom");

dom.table = component(state => {
    const table = inline(`
        <div data-rel="table" class="d-flex flex-column h-100 overflow-hidden">
            <style>
                [data-rel="table"] {
                    user-select: none;
                }
                tr { 
                    cursor: pointer;
                }
                tr:hover {
                    background-color: rgba(0, 123, 255, 0.1) !important;
                }
                tr td:hover {
                    background-color: rgba(0, 123, 255, 0.1) !important;
                }
                tr th:hover {
                    background-color: rgba(41, 144, 255) !important;
                }
                thead th {
                    position: sticky;
                    top: -1px;
                    z-index: 2;
                }
                ul.pagination li > span {
                    user-select: none;
                    cursor: pointer;
                }
            </style>
            <div class="row mb-2">
                <div class="col text-center">
                    <h4 data-rel="title"></h4>
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <div class="d-flex justify-content-center mb-2">
                        <div class="btn-group">
                            <button data-btn="copy" class="btn btn-primary">COPY</button>
                            <button data-btn="csv" class="btn btn-primary">CSV</button>
                            <button data-btn="excel" class="btn btn-primary">EXCEL</button>
                            <button data-btn="pdf" class="btn btn-primary">PDF</button>
                            <button data-btn="print" class="btn btn-primary">PRINT</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12 col-md-4">
                    <div class="d-flex align-items-end mb-2">
                        <label data-def="pageSizeLabel" class="label text-nowrap mr-2">Page Size</label>
                        <select data-rel="pageSizeSelect" class="custom-select">
                            <option>10</option>
                            <option>30</option>
                            <option>50</option>
                            <option>100</option>
                        </select>
                    </div>
                </div>
                <div class="col-12 col-md-4"></div>
                <div class="col-12 col-md-4">
                    <div class="d-flex align-items-end mb-2">
                        <label data-def="searchLabel" class="label mr-2">Search</label>
                        <input data-rel="searchInput" class="form-control" type="search">
                    </div>
                </div>
            </div>
            <div data-print="table" class="flex-grow-1 position-relative overflow-auto">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr></tr>
                    <thead>
                    <tbody><tbody>
                </table>
            </div>
            <div class="row mt-2">
                <div class="col mb-2 d-flex align-items-center justify-content-center">
                    <span data-def="pageTotalLabel" class="text-nowrap">Total: 50 de 200</span>
                </div>
                <div class="col mb-2 d-flex align-items-center justify-content-center">
                    <span data-def="pageCurrentLabel" class="text-nowrap">Página: 1</span>
                </div>
                <div class="col mb-2 d-flex justify-content-center align-items-center">
                    <ul class="pagination m-0"></ul>
                </div>
            </div>
        </div>
    `);

    const title = table.ref._rel.title;

    const head = table.ref.thead;
    const headRow = table.ref.thead.ref.tr;
    const body = table.ref.tbody;

    const pageSizeSelect = table.ref._rel.pageSizeSelect;
    const searchInput = table.ref._rel.searchInput;
    const paginator = table.ref.$pagination;

    const pageSizeLabel = table.ref._def.pageSizeLabel;
    const searchLabel = table.ref._def.searchLabel;
    const pageTotalLabel = table.ref._def.pageTotalLabel;
    const pageCurrentLabel = table.ref._def.pageCurrentLabel;

    const btnPDF = table.ref._btn.pdf;

    btnPDF.bind.click = () => {
        const doc = new jsPDF();
        // doc.text('Hello world!', 10, 10);
        console.log(table.ref._print.table);
        doc.fromHTML(table.ref._print.table, 10, 10);
        doc.save('a4.pdf');
    };

    searchInput.bind.change = () => {
        table.state.search = searchInput.value;
    };

    pageSizeSelect.bind.change = () => {
        table.state.pageSize = Number(pageSizeSelect.value);
    };

    pageSizeSelect.value = `${state.pageSize || 10}`;

    table.property.columns = {
        get() { return table.state.columNames || [] },
        set(columns) {
            clear(headRow);
            table.state.columNames = [];
            for (let columnName of columns) {
                table.state.columNames.push(columnName);
                let column = inline(`<th class="bg-primary text-white text-center">${columnName}</th>`);
                headRow.append(column);
            }
        }
    };
    table.property.rows = {
        set(rows) {
            const columns = rows.reduce((columns, row) => {
                for (let columnName in row) if (columns.indexOf(columnName) < 0) columns.push(columnName);
                return columns;
            }, []);
            table.state.columns = columns;
            table.state.records = [];
            for (let rowData of rows) {
                let row = inline(`<tr></tr>`);
                for (let columnName of columns) {
                    let value = {
                        data: rowData[columnName] === undefined ? "-" : rowData[columnName],
                        className: "text-center"
                    };
                    if (table.state.columnDefinitions) value = table.state.columnDefinitions[columnName](value);
                    // if (typeof rowData[columnName] === "object") value = rowData[columnName];
                    // let valueData = value;
                    // let className = "";
                    // if (typeof value === "object") {
                    //     if (value.data === undefined) value.data = "-";
                    //     valueData = value.data;
                    //     let defaultAlign = "center";
                    //     if (typeof valueData === "string") defaultAlign = "justify";
                    //     if (valueData === "-") defaultAlign = "center";
                    //     value.text = defaultAlign;
                    //     if (value.text) className += `text-${value.text} `;
                    // }
                    let data = inline(`
                        <td data-column="${columnName}" class="${value.className}">${value.data}</td>
                    `);
                    row.append(data);
                }
                table.state.addRow(row, rowData);
            }
            table.state.page = 0;
        }
    };

    table.state.records = [];
    table.state.currentTotalRecords = 0;

    table.defs.total = "Showing <strong>@:pageSize</strong> of <strong>@:currentTotalRecords</strong>";
    table.defs.page = "Page <strong>@:currentPage</strong> of <strong>@:pageCount</strong>";
    table.defs.pageSize = "Page Size";
    table.defs.search = "Search";

    table.state.addRow = (row, data) => {
        const index = table.state.records.length;
        const fullRow = { row, data, index };
        table.state.records.push(fullRow);
        table.state.currentRecords = table.state.records;
        for (let td of [...row.children]) {
            let column = td.dataset.column;
            td.bind.click = () => table.fire.selectedRow = { ...fullRow, column };
        }
        table.state.totalRecords = table.state.records.length;
        table.state.currentTotalRecords = table.state.currentRecords.length;
        table.state.pageSize = table.state.currentPageSize || 10;
    };
    table.property.pageSize = {
        get() { return table.state.currentPageSize },
        set(size) {
            table.state.currentPageSize = size;
            const pageCount = table.state.pageCount = Math.ceil(
                (table.state.currentRecords || []).length / table.state.pageSize
            );
            table.state.pageIndicators = [];
            for (let i = 0; i < pageCount; i++) {
                let pageIndicator = inline(`
                    <li class="page-item ${i > 0 && i + 1 < pageCount ? "d-none d-md-block" : ""}">
                        <span class="page-link">${i + 1}</span>
                    </li>
                `);
                pageIndicator.dataset.page = `${i}`;
                pageIndicator.bind.click = () => table.state.page = i;
                table.state.pageIndicators.push(pageIndicator);
            }
            table.state.page = 0;
            pageTotalLabel.innerHTML = table.defs.total.replace(/@:[\w-_.]+/g, w => {
                return table.state[w.replace("@:", "")];
            });
        },
    };
    table.property.page = {
        get() { return table.state.currentPage - 1 },
        set(page) {
            if (!table.state.currentRecords) return;
            const pageCount = table.state.pageCount;
            const pageSize = table.state.currentPageSize;
            table.state.currentPage = page + 1;
            pageCurrentLabel.innerHTML = table.defs.page.replace(/@:[\w-_.]+/g, w => {
                return table.state[w.replace("@:", "")];
            });
            clear(body);
            const records = table.state.currentRecords.slice(page * pageSize, (page + 1) * pageSize);
            for (let record of records) body.append(record.row);
            clear(paginator);
            const previousPageIndicator = inline(`
                <li class="page-item ${page <= 0 ? "disabled" : ""}">
                    <span class="page-link">Previous</span>
                </li>
            `);
            previousPageIndicator.bind.click = () => { if (page > 0) table.state.page = page - 1 };
            const caretPageIndicator = inline(`
            <li class="page-item"><span class="page-link">...</span></li>
            `);
            const nextPageIndicator = inline(`
                <li class="page-item ${page + 1 >= pageCount ? "disabled" : ""}">
                    <span class="page-link">Next</span>
                </li>
            `);
            nextPageIndicator.bind.click = () => { if (page + 1 < pageCount) table.state.page = page + 1 };
            const pageIndicators = [
                previousPageIndicator,
                ...table.state.pageIndicators.slice(0, 3),
                ...(pageCount > 7 ? [caretPageIndicator] : []),
                ...(pageCount === 7 ? [table.state.pageIndicators[3]] : []),
                ...table.state.pageIndicators.slice(pageCount - 3),
                nextPageIndicator,
            ];
            for (let pageIndicator of pageIndicators) {
                pageIndicator.classList.remove("active");
                if (pageIndicator.dataset.page === `${page}`) pageIndicator.classList.add("active");
                paginator.append(pageIndicator);
            }
        }
    };
    table.property.search = {
        set(text) {
            table.state.currentSearch = text;
            table.state.currentRecords = table.state.records.filter(record => {
                const data = record.data;
                for (let [key, value] of Object.entries(data)) {
                    if (`${value}`.toLowerCase().indexOf(text.toLowerCase()) >= 0) return true;
                }
                return false;
            });
            table.state.currentTotalRecords = table.state.currentRecords.length;
            pageTotalLabel.innerHTML = table.defs.total.replace(/@:[\w-_.]+/g, w => {
                return table.state[w.replace("@:", "")];
            });
            table.state.pageSize = table.state.currentPageSize;
            table.state.page = 0;
        },
    };

    table.state.pageSize = 10;

    table.property.title = {
        get() { return title.textContent },
        set(value) { title.textContent = value }
    };
    
    table.bind.update$table = currentState => {
        searchLabel.textContent = table.defs.search;
        pageSizeLabel.textContent = table.defs.pageSize;
    };

    return table;
});