const fs = require('fs/promises');
const path = require('path');
const fg = require('fast-glob');
const csvParser = require('./CSVParser');
const papa = require('papaparse');
const jsonts = require('json-ts');
const manifest = require('../generated/manifest.json');

const ESLINT_DISABLE = "/* eslint-disable */\n"

async function main() {

	await processSheets();
	await processManifest();
}

function merge(target, source) {
	const isObject = (obj) => obj && typeof obj === 'object';

	if (!isObject(target) || !isObject(source)) {
		return source;
	}

	Object.keys(source).forEach(key => {
		const targetValue = target[key];
		const sourceValue = source[key];

		if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
			target[key] = targetValue.concat(sourceValue);
		} else if (isObject(targetValue) && isObject(sourceValue)) {
			target[key] = merge(Object.assign({}, targetValue), sourceValue);
		} else {
			target[key] = sourceValue;
		}
	});

	return target;
}

const buildObjWithValue = (path, value = '') => {
	const paths = path.split('/');
	return paths.reduceRight((acc, item, index) => ({
		[item]: index === paths.length - 1
			? value
			: acc
	}), {});
}

async function processManifest() {
	console.log("Writing types for manifest");
	const bundles = {};
	for (const bundle of manifest.bundles) {
		for (const asset of bundle.assets) {
			if (asset.name[0].endsWith("atlas1.json")) {
				for (const atlas of asset.srcs) {
					if (atlas.endsWith("png.json")) {
						const parsedAtlas = JSON.parse(await fs.readFile(path.join("./generated/", atlas), 'utf8'));
						for (const tex in parsedAtlas.frames) {
							const namePath = path.join(path.dirname(asset.name[0]), tex).replace(/\./g, "_").replace(/\\/g, "/").split("/");
							merge(bundles, buildObjWithValue(namePath.join("/"), tex));
						}
					}
				}
			} else {
				const namePath = asset.name[0].replace(/\./g, "_").split("/");
				merge(bundles, buildObjWithValue(namePath.join("/"), asset.name[0]));
			}
		}
	}

	const jsonDef = JSON.stringify({ Bundles: bundles }, null, 2)

	const outFile = "./src/generatedCode/AssetLibrary.json";
	await fs.mkdir(path.dirname(outFile), { recursive: true });
	await fs.writeFile(outFile, jsonDef, 'utf8');

	const tsDef = ESLINT_DISABLE + `
		import A from "./AssetLibrary.json";
		export const AssetLibrary = A;`;

	const outFileTs = "./src/generatedCode/AssetLibrary.ts";
	await fs.mkdir(path.dirname(outFileTs), { recursive: true });
	await fs.writeFile(outFileTs, tsDef, 'utf8');

	return { Bundles: bundles }
}

async function processSheets() {
	console.log("Writing metadata for sheets");
	const sheetFiles = await fg("./generated/**/*.sheets");

	const metaDataPromises = sheetFiles.map(async (file) => {
		const sheetText = await fs.readFile(file, 'utf8')
		let sheetJson;

		try {
			sheetJson = JSON.parse(sheetText);
		} catch (error) {
			console.error("Error parsing " + file + ". Json malformed", error);
			return Promise.resolve();
		}

		const sheetPromises = [];
		for (const csvName in sheetJson) {
			sheetPromises.push(writeMetaFile(sheetJson[csvName], path.join(path.dirname(file), csvName) + ".csv.meta"));
		}
		return await Promise.all(sheetPromises);
	});

	const typePromises = sheetFiles.map(async (file) => {
		const sheetText = await fs.readFile(file, 'utf8')
		let sheetJson;

		try {
			sheetJson = JSON.parse(sheetText);
		} catch (error) {
			console.error("Error parsing " + file + ". Json malformed", error);
			return Promise.resolve();
		}

		const tables = [];
		for (const csvName in sheetJson) {
			const csvText = await fs.readFile(path.join(path.dirname(file), csvName) + ".csv", 'utf8')
			const parsedCsv = papa.parse(csvText, { header: false, dynamicTyping: true, skipEmptyLines: false, download: false, worker: false });
			tables.push(csvParser.processTable(parsedCsv.data, csvName));
		}
		const linkedTables = csvParser.linkTables(tables);

		try {
			const tsDef = jsonts.json2ts(JSON.stringify(linkedTables), { prefix: "", rootName: path.basename(file, ".sheets") });
			const outFile = path.join("./src/generatedCode/", path.basename(file, ".sheets")) + ".ts";
			await fs.mkdir(path.dirname(outFile), { recursive: true });
			await fs.writeFile(outFile, ESLINT_DISABLE + tsDef, 'utf8');
		} catch (_) {
			console.warn("Circular references in tables, can't generate types!", file);
			console.log(_);
			return Promise.resolve();
		}
	});



	await Promise.all(metaDataPromises, typePromises);
}

async function writeMetaFile(metaData, filename) {
	if (!metaData) return Promise.resolve();
	if (!metaData.sheet || !metaData.gid) return Promise.resolve();

	await fs.writeFile(filename, JSON.stringify(metaData), 'utf8');

	console.log("Metadata written", filename);
}

main();
