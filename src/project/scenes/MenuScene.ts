import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";

export class MenuScene extends PixiScene {
	public static readonly BUNDLES = ["img"];

	constructor() {
		super();
	}

	public override update(_dt: number): void {}
}
