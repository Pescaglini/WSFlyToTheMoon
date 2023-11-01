"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkTables = exports.processTable = void 0;
function processTable(data, tableName) {
    ensureId(data, "dungeons");
    var headers = removeHeaders(data);
    linkHeaderTables(headers);
    mergeRows(data, headers);
    return {
        data: mergeColumns(data, headers),
        headers: headers,
        tableName: tableName,
    };
}
exports.processTable = processTable;
function ensureId(data, table) {
    var hasId = data[0].some(function (header) {
        return typeof header === "string" && header.toLowerCase() === "id";
    });
    if (!hasId) {
        data[0].unshift("id");
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            row.unshift("".concat(table, "_").concat(i.toString().padStart(3, "0")));
        }
    }
}
function removeHeaders(data) {
    var headers = data[0];
    var firstElementIndex = 1;
    var idIndex = headers.findIndex(function (header) { return typeof header === "string" && header.toLowerCase() === "id"; });
    for (var i = firstElementIndex; i < data.length; i++) {
        var row = data[i];
        if (row[idIndex]) {
            firstElementIndex = i;
            break;
        }
    }
    // extract top level headers
    var headerData = [];
    for (var column = 0; column < headers.length; column++) {
        var header = headers[column];
        if (header) {
            var headerInfo = {
                row: 0,
                column: column,
                isPrimary: column === idIndex,
                name: String(header).trim(),
                kind: "value",
                size: 1,
            };
            headerData.push(headerInfo);
        }
        else {
            var headerInfo = headerData[headerData.length - 1];
            headerInfo.size++;
        }
    }
    for (var _i = 0, headerData_1 = headerData; _i < headerData_1.length; _i++) {
        var headerDatum = headerData_1[_i];
        // single data is ok.
        if (headerDatum.size == 1) {
            continue;
        }
        if (headerDatum.row + 1 >= firstElementIndex || !data[headerDatum.row + 1][headerDatum.column]) {
            // array
            headerDatum.kind = "array";
            headerDatum.children = [];
            var idx = 0;
            for (var subColumn = headerDatum.column; subColumn < headerDatum.column + headerDatum.size; subColumn++) {
                headerDatum.children.push({
                    row: headerDatum.row + 1,
                    column: subColumn,
                    kind: "value",
                    size: 1,
                    name: String(idx),
                });
                idx++;
            }
        }
        else {
            // object
            headerDatum.kind = "object";
            headerDatum.children = [];
            for (var subColumn = headerDatum.column; subColumn < headerDatum.column + headerDatum.size; subColumn++) {
                headerDatum.children.push({
                    row: headerDatum.row + 1,
                    column: subColumn,
                    kind: "value",
                    size: 1,
                    name: String(data[headerDatum.row + 1][subColumn]).trim(),
                });
            }
        }
    }
    // remove header rows
    data.splice(0, firstElementIndex);
    return headerData;
}
function mergeRows(data, headers) {
    var idx = headers.find(function (header) { return header.isPrimary; }).column;
    for (var i = 0; i < data.length; i++) {
        var size = 0;
        for (var j = i + 1; j < data.length; j++) {
            if (data[i][idx] === data[j][idx] || !data[j][idx]) {
                size++;
            }
            else {
                break;
            }
        }
        if (size > 0) {
            // We found at least one multimagicthingy
            for (var _i = 0, headers_1 = headers; _i < headers_1.length; _i++) {
                var header = headers_1[_i];
                if (header.isPrimary) {
                    continue;
                } // pkey cant be array
                for (var offset = 0; offset < header.size; offset++) {
                    var arr = [data[i][header.column + offset]]; // an array of itself
                    for (var j = i + 1; j < i + size + 1; j++) {
                        arr.push(data[j][header.column + offset]);
                    }
                    var isOnlyFirstElementValid = arr.every(function (obj, idx) {
                        var firstElementValid = idx == 0 && obj;
                        var otherElementsEmpty = idx > 0 && !obj;
                        return firstElementValid || otherElementsEmpty;
                    });
                    if (isOnlyFirstElementValid) {
                        //  we found a single value at the top. This isn't an array, this is a merged cell
                        continue;
                    }
                    // we array now bois
                    data[i][header.column + offset] = arr;
                }
            }
            // remove the empty/merged rows
            data.splice(i + 1, size);
        }
    }
}
function linkHeaderTables(headers, regexp) {
    if (regexp === void 0) { regexp = /\(([^)]+)\)/; }
    for (var _i = 0, headers_2 = headers; _i < headers_2.length; _i++) {
        var header = headers_2[_i];
        var regexMatch = regexp.exec(header.name);
        if (regexMatch && regexMatch.length > 1) {
            if (header.linkedTable && header.linkedTable !== regexMatch[1]) {
                console.warn("Header ".concat(header.name, " already has a linked table ").concat(header.linkedTable, ".\nThis is because the parent linked a table and the child tried to link a differnt one!\nThis is probably a mistake but we linked the child table anyway."));
            }
            header.linkedTable = regexMatch[1].trim();
            header.name = header.name.replace(regexp, "").trim();
            if (header.children) {
                for (var _a = 0, _b = header.children; _a < _b.length; _a++) {
                    var child = _b[_a];
                    child.linkedTable = header.linkedTable;
                }
            }
        }
        if (header.children) {
            // Force check the children to throw error if there is a conflict
            linkHeaderTables(header.children, regexp);
        }
    }
}
function mergeColumns(data, headers) {
    var result = [];
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var datum = data_1[_i];
        var newRow = {};
        for (var _a = 0, headers_3 = headers; _a < headers_3.length; _a++) {
            var columnInfo = headers_3[_a];
            if (columnInfo.kind === "value") {
                newRow[columnInfo.name] = datum[columnInfo.column];
            }
            else if (columnInfo.kind === "array") {
                var arr = [];
                for (var _b = 0, _c = columnInfo.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    arr.push(datum[child.column]);
                }
                newRow[columnInfo.name] = arr;
            }
            else if (columnInfo.kind === "object") {
                var obj = {};
                for (var _d = 0, _e = columnInfo.children; _d < _e.length; _d++) {
                    var child = _e[_d];
                    obj[child.name] = datum[child.column];
                }
                newRow[columnInfo.name] = obj;
            }
        }
        result.push(newRow);
    }
    return result;
}
function getId(rowRecord) {
    for (var key in rowRecord) {
        if (key.toLowerCase() === "id") {
            return rowRecord[key];
        }
    }
    return undefined;
}
function linkTables(tables) {
    var retval = {};
    for (var _i = 0, tables_1 = tables; _i < tables_1.length; _i++) {
        var table = tables_1[_i];
        retval[table.tableName] = table.data;
    }
    for (var _a = 0, tables_2 = tables; _a < tables_2.length; _a++) {
        var table = tables_2[_a];
        for (var _b = 0, _c = table.headers; _b < _c.length; _b++) {
            var header = _c[_b];
            if (header.linkedTable) {
                if (!retval[header.linkedTable]) {
                    console.warn("Table ".concat(table.tableName, " linked to ").concat(header.linkedTable, " but ").concat(header.linkedTable, " does not exist!"));
                }
                else {
                    var _loop_1 = function (datum) {
                        var linkedField = datum[header.name];
                        if (Array.isArray(linkedField)) {
                            var _loop_2 = function (i) {
                                var linkedId = linkedField[i];
                                if (!linkedId) {
                                    return "continue";
                                }
                                var linkedDatum = retval[header.linkedTable].find(function (datum2) { return getId(datum2) == linkedId; });
                                if (linkedDatum) {
                                    linkedField[i] = linkedDatum;
                                }
                                else {
                                    console.warn("Table ".concat(table.tableName, " linked to ").concat(header.linkedTable, " but ").concat(header.linkedTable, " does not contain id ").concat(linkedId, "!"));
                                }
                            };
                            for (var i = 0; i < linkedField.length; i++) {
                                _loop_2(i);
                            }
                        }
                        else if (typeof linkedField == "object") {
                            var _loop_3 = function (key) {
                                var linkedId = linkedField[key];
                                if (!linkedId) {
                                    return "continue";
                                }
                                var linkedDatum = retval[header.linkedTable].find(function (datum2) { return getId(datum2) == linkedId; });
                                if (linkedDatum) {
                                    linkedField[key] = linkedDatum;
                                }
                                else {
                                    console.warn("Table ".concat(table.tableName, " linked to ").concat(header.linkedTable, " but ").concat(header.linkedTable, " does not contain id ").concat(linkedId, "!"));
                                }
                            };
                            for (var key in linkedField) {
                                _loop_3(key);
                            }
                        }
                        else {
                            var linkedId_1 = datum[header.name];
                            if (!linkedId_1) {
                                return "continue";
                            }
                            var linkedDatum = retval[header.linkedTable].find(function (datum2) { return getId(datum2) == linkedId_1; });
                            if (linkedDatum) {
                                datum[header.name] = linkedDatum;
                            }
                            else {
                                console.warn("Table ".concat(table.tableName, " linked to ").concat(header.linkedTable, " but ").concat(header.linkedTable, " does not contain id ").concat(String(linkedId_1), "!"));
                            }
                        }
                    };
                    for (var _d = 0, _e = table.data; _d < _e.length; _d++) {
                        var datum = _e[_d];
                        _loop_1(datum);
                    }
                }
            }
        }
    }
    return retval;
}
exports.linkTables = linkTables;
