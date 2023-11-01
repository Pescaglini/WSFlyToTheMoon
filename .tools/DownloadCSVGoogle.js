const fs = require('fs/promises');
const path = require('path');
const fg = require('fast-glob');


async function main() {
	console.log("Downloading Google Sheets");
	const metaFiles = await fg("./assets/**/*.sheets");

	const promises = metaFiles.map(async (file) => {

		const metaText = await fs.readFile(file, 'utf8')
		let metaJson;

		try {
			metaJson = JSON.parse(metaText);
		} catch (error) {
			console.error("Error parsing " + file + ". Json malformed", error);
			return Promise.resolve();
		}
		const metaPromises = [];
		for (const csvName in metaJson) {
			metaPromises.push(tryDownloadGoogleSheet(metaJson[csvName], path.join(path.dirname(file), csvName) + ".csv"));
		}
		return await Promise.all(metaPromises);
	});

	await Promise.all(promises);

	console.log("Download finished")
}

async function tryDownloadGoogleSheet(data, file) {
	if (!data) return Promise.resolve();
	if (!data.sheet || !data.gid) return Promise.resolve();
	const csv = await (await fetch(`https://docs.google.com/spreadsheets/d/${data.sheet}/gviz/tq?tqx=out:csv&gid=${data.gid}`)).text();

	await fs.writeFile(file, csv, 'utf8');

	console.log("Downloaded", file);
}


main();