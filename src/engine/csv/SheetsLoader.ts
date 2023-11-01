import type { ResolvedAsset, Loader } from "@pixi/assets";
import { LoaderParserPriority, type LoaderParser, Assets } from "@pixi/assets";
import { ExtensionType, utils, settings, extensions } from "@pixi/core";
import { path } from "@pixi/utils";
import type { Table } from "./CSVParser";
import { linkTables, processTable } from "./CSVParser";

export const loadSheets = {
	name: "loadSheets",

	extension: {
		type: ExtensionType.LoadParser,
		priority: LoaderParserPriority.Low,
	},

	test(url: string): boolean {
		return utils.path.extname(url).toLowerCase() === ".sheets";
	},

	async load(url: string, _: ResolvedAsset): Promise<any> {
		const response = await settings.ADAPTER.fetch(url);

		return await response.json();
	},

	testParse(_asset: string, options: ResolvedAsset): Promise<boolean> {
		return Promise.resolve(utils.path.extname(options.src).toLowerCase() === ".sheets");
	},

	async parse(asset: any, options: ResolvedAsset, _loader: Loader): Promise<any> {
		const dirName = path.dirname(options.alias[0]);
		console.log(dirName);
		const tables: Table[] = [];
		for (const key in asset) {
			console.log(key);
			const asset = await Assets.load(path.join(dirName, `${key}.csv`));
			console.log(asset);
			tables.push(processTable(asset, key));
		}
		return linkTables(tables);
	},
} as LoaderParser;

extensions.add(loadSheets);
