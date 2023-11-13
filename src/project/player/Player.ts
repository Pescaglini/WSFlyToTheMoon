import { Container } from "@pixi/display";
import { PlayerVisuals } from "./PlayerVisuals";

export class Player extends Container {
	private health: number;
	public visuals: PlayerVisuals;
	constructor() {
		super();
		this.health = 100;
		this.visuals = new PlayerVisuals();
		console.log(this.health);
	}
	public update(_dt: number): void {}
}
