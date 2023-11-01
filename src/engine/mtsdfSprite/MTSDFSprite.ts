import type { IBaseTextureOptions } from "@pixi/core";
import { Texture } from "@pixi/core";
import type { SpriteSource } from "@pixi/sprite";
import { Sprite } from "@pixi/sprite";

export class MTSDFSprite extends Sprite {
	public override pluginName = "mtsdf";
	public range: number;

	constructor(texture?: Texture, range?: number) {
		super(texture);
		this.pluginName = "mtsdf";
		this.range = range ?? 2;
	}

	public static override from(source: SpriteSource, options?: IBaseTextureOptions): MTSDFSprite;
	public static override from(source: SpriteSource, range?: number): MTSDFSprite;
	public static override from(source: SpriteSource, options?: IBaseTextureOptions, range?: number): MTSDFSprite;
	public static override from(source: SpriteSource, optionsOrRange?: IBaseTextureOptions | number, range?: number): MTSDFSprite {
		let options: IBaseTextureOptions = undefined;
		if (typeof optionsOrRange == "number") {
			range = optionsOrRange;
		} else {
			options = optionsOrRange;
		}

		const texture = source instanceof Texture ? source : Texture.from(source, options);
		return new MTSDFSprite(texture, range);
	}
}
