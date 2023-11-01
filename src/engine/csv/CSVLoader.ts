import type { ResolvedAsset, Loader } from "@pixi/assets";
import { LoaderParserPriority, type LoaderParser } from "@pixi/assets";
import { ExtensionType, utils, settings, extensions } from "@pixi/core";
import Papa from "papaparse";
import { CSV_FROM_GOOGLE } from "../../flags";
/** Simple loader plugin for loading text data */
export const loadCsv = {
	name: "loadCsv",

	extension: {
		type: ExtensionType.LoadParser,
		priority: LoaderParserPriority.Low,
	},

	test(url: string): boolean {
		return utils.path.extname(url).toLowerCase() === ".csv";
	},

	async load(url: string, asset: ResolvedAsset): Promise<any> {
		let csvUrl = url;
		if (CSV_FROM_GOOGLE) {
			if (asset?.data?.gid && asset?.data?.sheet) {
				csvUrl = `https://docs.google.com/spreadsheets/d/${asset.data.sheet as string}/gviz/tq?tqx=out:csv&gid=${asset.data.gid as string}`;
			} else {
				try {
					const data = await (await settings.ADAPTER.fetch(csvUrl.replace(".csv", ".csv.meta"))).json();
					if (data?.gid && data?.sheet) {
						csvUrl = `https://docs.google.com/spreadsheets/d/${data.sheet as string}/gviz/tq?tqx=out:csv&gid=${data.gid as string}`;
					}
				} catch (e: any) {
					console.warn(
						`No metadata found for csv file: ${csvUrl} ... or maybe we did find metadata but your json was wrong?\nDo you have a 404 on the .meta file? -> You didn't create the meta and run start again\nDo you have the file but still fails? -> Your json is broken. Fix and run start again\nerr: `,
						e
					);
					// no big deal, no metadata found, we just use the original url
				}
			}
		}
		const response = await settings.ADAPTER.fetch(csvUrl);

		const txt = await response.text();

		return txt;
	},

	testParse(_asset: string, options: ResolvedAsset): Promise<boolean> {
		return Promise.resolve(utils.path.extname(options.src).toLowerCase() === ".csv");
	},

	parse(asset: string, options: ResolvedAsset, _loader: Loader): Promise<any> {
		const parserOptions = { header: false, dynamicTyping: true, skipEmptyLines: false, ...(options?.data ?? {}), download: false, worker: false };
		const csv = Papa.parse(asset, parserOptions as { download: false; worker: false });

		// check that we didn't overwrite any fields
		if (csv.meta.fields && csv.meta.fields.length > 0 && new Set(csv.meta.fields).size !== csv.meta.fields.length) {
			csv.errors.push({ code: "DuplicatedFields", message: "Duplicated fields in CSV file", row: -1, type: "FieldMismatch", fields: csv.meta.fields } as any);
		}

		if (csv.errors && csv.errors.length > 0) {
			console.warn(`CSV Loader: Errors parsing CSV file: ${options.src}`, csv.errors);
		}
		return Promise.resolve(csv.data);
	},
} as LoaderParser;

extensions.add(loadCsv);
