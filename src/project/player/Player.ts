import { PlayerVisuals } from "./PlayerVisuals";

export class Player {
	private health: number;
	public visuals: PlayerVisuals;
	constructor() {
		this.health = 100;
		this.visuals = new PlayerVisuals();
		console.log(this.health);
	}
	public update(_dt: number): void {}
}
