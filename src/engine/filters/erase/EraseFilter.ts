import type { ISpriteMaskTarget } from "@pixi/core";
import { SpriteMaskFilter } from "@pixi/core";
import vert from "./invertedSpriteMaskFilter.vert";
import frag from "./invertedSpriteMaskFilter.frag";

export class EraseFilter extends SpriteMaskFilter {
	constructor(mask: ISpriteMaskTarget) {
		super(vert, frag);
		this.maskSprite = mask;
	}
}
