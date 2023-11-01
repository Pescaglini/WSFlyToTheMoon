/**
 * Receive a json created in Tiled and return it formatted with predictions.
 * Replace all global ids from the tile layers with the tile information, provided in the tilesets.
 */
export function formatTiledJSON(json: any): JSONTileMap {
	if (json.formatted) {
		console.log("Already formatted json");
		return json;
	}
	json.layersRecord = {};
	formatLayers(json.layers, json.tilesets, json.layersRecord, "");
	json.formatted = true;
	return json;
}

function formatLayers(
	layers: Array<TileLayer | ObjectLayer | GroupLayer>,
	tileSets: Array<TileSet>,
	layersRecord: Record<string, TileLayer | ObjectLayer | GroupLayer>,
	prefix: string
): void {
	for (let i = 0; i < layers.length; i++) {
		const layer: TileLayer | ObjectLayer | GroupLayer = layers[i];
		layer.index = i;
		switch (layer.type) {
			case "group":
				formatLayers(layer.layers, tileSets, layersRecord, `${prefix}${layer.name}/`);
				break;
			case "tilelayer":
				replaceGIDwithTiles(layer.data, tileSets);
				break;
		}
		layersRecord[prefix + layer.name] = layer;
	}
}

function replaceGIDwithTiles(tilesArr: any, tilesets: Array<TileSet>): void {
	for (let i = 0; i < tilesArr.length; i++) {
		const gid = tilesArr[i];
		if (gid == 0) {
			tilesArr[i] = emptyTyle;
		}
		for (const tileset of tilesets) {
			if (gid < tileset.firstgid || gid > tileset.firstgid + (tileset.tilecount - 1)) {
				continue;
			}
			const internalId = gid - tileset.firstgid;
			const tileInfo = getTileInfo(tileset, internalId);

			const obtainedData: Tile = {
				id: internalId,
				image: tileInfo?.image,
				gid: gid,
				properties: tileInfo?.properties,
				tilesetName: tileset.name,
				type: tileInfo?.type,
			};
			tilesArr[i] = obtainedData;
		}
	}
}

function getTileInfo(tileset: TileSet, tileIndex: number): { properties: Array<Properties>; type: string; image: string } {
	if (tileset.tiles == undefined) {
		return null;
	}
	for (const tile of tileset.tiles) {
		if (tile.id != tileIndex) {
			continue;
		}
		return { properties: tile.properties, type: tile.type, image: tile.image };
	}
	return null;
}

type JSONTileMap = {
	class?: string;
	compressionlevel: number;
	formatted: boolean;
	height: number;
	infinite: boolean;
	layers: Array<TileLayer | ObjectLayer | GroupLayer>;
	layersRecord: Record<string, TileLayer | ObjectLayer | GroupLayer>;
	nextlayerid: number;
	nextobjectid: number;
	orientation: "isometric" | "orthogonal" | "hexagonal" | "staggered";
	properties?: Array<Properties>;
	renderorder: "right-down" | "right-up" | "left-down" | "left-up";
	tiledversion: number;
	tileheight: number;
	tilesets: Array<TileSet>;
	tilewidth: number;
	type: "map";
	version: number;
	width: number;
};

interface Layer {
	class?: string;
	draworder: string;
	id: number;
	index: number;
	name: string;
	opacity: number;
	properties?: Array<Properties>;
	type: string;
	visible: boolean;
	x: number;
	y: number;
}

interface TileLayer extends Layer {
	data: Array<number>;
	tilesdata: Array<Tile>;
	type: "tilelayer";
	width: number;
}

interface ObjectLayer extends Layer {
	objects: Array<TiledObject>;
	type: "objectgroup";
}

interface GroupLayer extends Layer {
	layers: Array<TileLayer | GroupLayer | ObjectLayer>;
	type: "group";
}

type TiledObject = {
	height: number;
	id: number;
	name: string;
	point: boolean;
	properties?: Array<Properties>;
	rotation: number;
	type: string;
	visible: boolean;
	width: number;
	x: number;
	y: number;
};

type TileSet = {
	columns: number;
	firstgid: number;
	image: string;
	imageheight: number;
	imagewidth: number;
	margin: number;
	name: string;
	spacing: number;
	tilecount: number;
	tileheight: number;
	tiles?: Array<Tile>;
	tilewidth: number;
};

type Tile = {
	id: number;
	image: string;
	gid: number;
	properties?: Array<Properties>;
	tilesetName: string;
	type?: string;
};

const emptyTyle: Tile = {
	id: null,
	image: null,
	gid: 0,
	tilesetName: null,
};

type Properties = {
	name: string;
	propertytype?: string;
	type: string;
	value: string | number;
};
