import { Container } from "@pixi/display";
import { Sprite } from "@pixi/sprite";

export class PlayerVisuals extends Container {
	private body: Sprite;

	public get speed(): number {
		return 300;
	}

	constructor() {
		super();
		this.body = Sprite.from("playerAssets/soldier_1.png");
		this.body.anchor.set(0.5, 0.7);
		this.body.scale.set(0.5);
		this.addChild(this.body);
	}

	public onResize(_newW: number, _newH: number): void {
		this.position.set(_newW * 0.5, _newH * 0.5);
	}
}
