export type RowArray = Array<unknown>;
export type RowRecord = Record<string, unknown>;

export type Table = {
	tableName: string;
	headers: HeaderInfo[];
	data: RowRecord[];
};

type HeaderInfo = {
	isPrimary?: boolean;
	row: number;
	column: number;
	name: string;
	size: number;
	kind: "array" | "object" | "value";
	children?: HeaderInfo[];
	linkedTable?: string;
};

export function processTable(data: RowArray[], tableName: string): Table {
	ensureId(data, "dungeons");
	const headers = removeHeaders(data);
	linkHeaderTables(headers);
	mergeRows(data, headers);
	return {
		data: mergeColumns(data, headers),
		headers,
		tableName: tableName,
	};
}

function ensureId(data: Array<RowArray>, table: string): void {
	const hasId = data[0].some((header) => {
		return typeof header === "string" && header.toLowerCase() === "id";
	});
	if (!hasId) {
		data[0].unshift("id");

		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			row.unshift(`${table}_${i.toString().padStart(3, "0")}`);
		}
	}
}

function removeHeaders(data: Array<RowArray>): HeaderInfo[] {
	const headers = data[0];
	let firstElementIndex = 1;
	const idIndex = headers.findIndex((header) => typeof header === "string" && header.toLowerCase() === "id");
	for (let i = firstElementIndex; i < data.length; i++) {
		const row = data[i];
		if (row[idIndex]) {
			firstElementIndex = i;
			break;
		}
	}

	// extract top level headers

	const headerData: HeaderInfo[] = [];
	for (let column = 0; column < headers.length; column++) {
		const header = headers[column];
		if (header) {
			const headerInfo: HeaderInfo = {
				row: 0,
				column,
				isPrimary: column === idIndex,
				name: String(header).trim(),
				kind: "value", // to be modified after
				size: 1,
			};
			headerData.push(headerInfo);
		} else {
			const headerInfo = headerData[headerData.length - 1];
			headerInfo.size++;
		}
	}
	for (const headerDatum of headerData) {
		// single data is ok.
		if (headerDatum.size == 1) {
			continue;
		}

		if (headerDatum.row + 1 >= firstElementIndex || !data[headerDatum.row + 1][headerDatum.column]) {
			// array
			headerDatum.kind = "array";
			headerDatum.children = [];
			let idx = 0;
			for (let subColumn = headerDatum.column; subColumn < headerDatum.column + headerDatum.size; subColumn++) {
				headerDatum.children.push({
					row: headerDatum.row + 1,
					column: subColumn,
					kind: "value",
					size: 1,
					name: String(idx),
				});
				idx++;
			}
		} else {
			// object
			headerDatum.kind = "object";
			headerDatum.children = [];
			for (let subColumn = headerDatum.column; subColumn < headerDatum.column + headerDatum.size; subColumn++) {
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

function mergeRows(data: Array<RowArray>, headers: HeaderInfo[]): void {
	const idx = headers.find((header) => header.isPrimary).column;
	for (let i = 0; i < data.length; i++) {
		let size = 0;
		for (let j = i + 1; j < data.length; j++) {
			if (data[i][idx] === data[j][idx] || !data[j][idx]) {
				size++;
			} else {
				break;
			}
		}
		if (size > 0) {
			// We found at least one multimagicthingy
			for (const header of headers) {
				if (header.isPrimary) {
					continue;
				} // pkey cant be array

				for (let offset = 0; offset < header.size; offset++) {
					const arr = [data[i][header.column + offset]]; // an array of itself

					for (let j = i + 1; j < i + size + 1; j++) {
						arr.push(data[j][header.column + offset]);
					}
					const isOnlyFirstElementValid = arr.every((obj, idx) => {
						const firstElementValid = idx == 0 && obj;
						const otherElementsEmpty = idx > 0 && !obj;
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

function linkHeaderTables(headers: HeaderInfo[], regexp: RegExp = /\(([^)]+)\)/): void {
	for (const header of headers) {
		const regexMatch = regexp.exec(header.name);
		if (regexMatch && regexMatch.length > 1) {
			if (header.linkedTable && header.linkedTable !== regexMatch[1]) {
				console.warn(
					`Header ${header.name} already has a linked table ${header.linkedTable}.\nThis is because the parent linked a table and the child tried to link a differnt one!\nThis is probably a mistake but we linked the child table anyway.`
				);
			}

			header.linkedTable = regexMatch[1].trim();
			header.name = header.name.replace(regexp, "").trim();

			if (header.children) {
				for (const child of header.children) {
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

function mergeColumns(data: Array<RowArray>, headers: HeaderInfo[]): RowRecord[] {
	const result: RowRecord[] = [];
	for (const datum of data) {
		const newRow: Record<string, unknown> = {};
		for (const columnInfo of headers) {
			if (columnInfo.kind === "value") {
				newRow[columnInfo.name] = datum[columnInfo.column];
			} else if (columnInfo.kind === "array") {
				const arr = [];
				for (const child of columnInfo.children) {
					arr.push(datum[child.column]);
				}
				newRow[columnInfo.name] = arr;
			} else if (columnInfo.kind === "object") {
				const obj: Record<string, unknown> = {};
				for (const child of columnInfo.children) {
					obj[child.name] = datum[child.column];
				}
				newRow[columnInfo.name] = obj;
			}
		}
		result.push(newRow);
	}

	return result;
}

function getId(rowRecord: RowRecord): unknown {
	for (const key in rowRecord) {
		if (key.toLowerCase() === "id") {
			return rowRecord[key];
		}
	}
	return undefined;
}

export function linkTables<TableRecordDefinition = Record<string, RowRecord[]>>(tables: Table[]): TableRecordDefinition {
	const retval: Record<string, RowRecord[]> = {};
	for (const table of tables) {
		retval[table.tableName] = table.data;
	}

	for (const table of tables) {
		for (const header of table.headers) {
			if (header.linkedTable) {
				if (!retval[header.linkedTable]) {
					console.warn(`Table ${table.tableName} linked to ${header.linkedTable} but ${header.linkedTable} does not exist!`);
				} else {
					for (const datum of table.data) {
						const linkedField = datum[header.name];
						if (Array.isArray(linkedField)) {
							for (let i = 0; i < linkedField.length; i++) {
								const linkedId = linkedField[i];
								if (!linkedId) {
									continue;
								}
								const linkedDatum = retval[header.linkedTable].find((datum2) => getId(datum2) == linkedId);
								if (linkedDatum) {
									linkedField[i] = linkedDatum;
								} else {
									console.warn(`Table ${table.tableName} linked to ${header.linkedTable} but ${header.linkedTable} does not contain id ${linkedId}!`);
								}
							}
						} else if (typeof linkedField == "object") {
							for (const key in linkedField) {
								const linkedId = (linkedField as any)[key];
								if (!linkedId) {
									continue;
								}
								const linkedDatum = retval[header.linkedTable].find((datum2) => getId(datum2) == linkedId);
								if (linkedDatum) {
									(linkedField as any)[key] = linkedDatum;
								} else {
									console.warn(`Table ${table.tableName} linked to ${header.linkedTable} but ${header.linkedTable} does not contain id ${linkedId}!`);
								}
							}
						} else {
							const linkedId = datum[header.name];
							if (!linkedId) {
								continue;
							}
							const linkedDatum = retval[header.linkedTable].find((datum2) => getId(datum2) == linkedId);
							if (linkedDatum) {
								datum[header.name] = linkedDatum;
							} else {
								console.warn(`Table ${table.tableName} linked to ${header.linkedTable} but ${header.linkedTable} does not contain id ${String(linkedId)}!`);
							}
						}
					}
				}
			}
		}
	}
	return retval as TableRecordDefinition;
}
