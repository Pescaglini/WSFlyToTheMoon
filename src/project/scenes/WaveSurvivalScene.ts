import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { Player } from "../player/Player";

export class WaveSurvivalScene extends PixiScene {
	private player: Player;
	constructor() {
		super();
		this.player = new Player();
		this.addChild(this.player);
	}

	public override update(dt: number): void {
		this.player.update(dt);
	}

	public override onResize(_newW: number, _newH: number): void {
		this.player.visuals.onResize(_newW, _newH);
	}
}
