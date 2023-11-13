import type { Graphics } from "@pixi/graphics";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { Player } from "../player/Player";
import { GraphicsHelper } from "../../engine/utils/GraphicsHelper";
import { Keyboard } from "../../engine/input/Keyboard";
import { Key } from "../../engine/input/Key";
import { Container } from "@pixi/display";
import { Sprite } from "@pixi/sprite";

export class WaveSurvivalScene extends PixiScene {
	private player: Player;
	private background: Container;
	private interactiveScreen: Graphics;
	private keyboard: Keyboard;
	private world: Container;
	constructor() {
		super();
		this.interactiveScreen = GraphicsHelper.pixel(0x000000, 0.01);
		this.keyboard = new Keyboard();
		this.world = new Container();

		this.background = new Container();
		const bg11 = Sprite.from("playerAssets/WS_Bg1_r1c1.png");
		bg11.scale.set(0.5);
		const bg12 = Sprite.from("playerAssets/WS_Bg1_r1c2.png");
		bg12.scale.set(0.5);
		bg12.x = bg11.x + bg11.width;
		const bg13 = Sprite.from("playerAssets/WS_Bg1_r2c1.png");
		bg13.scale.set(0.5);
		bg13.y = bg11.y + bg11.height;
		const bg14 = Sprite.from("playerAssets/WS_Bg1_r2c2.png");
		bg14.scale.set(0.5);
		bg14.x = bg11.x + bg11.width;
		bg14.y = bg11.y + bg11.height;
		this.background.addChild(bg11, bg12, bg13, bg14);

		this.player = new Player();
		this.world.addChild(this.background, this.player.visuals);
		this.addChild(this.world, this.interactiveScreen);
	}

	private keyboardConfig(dt: number): void {
		dt /= 1000;
		if (this.keyboard.isDown(Key.KEY_D)) {
			this.player.visuals.x += 300 * dt;
		}
		if (this.keyboard.isDown(Key.KEY_A)) {
			this.player.visuals.x -= 300 * dt;
		}
	}

	public override update(dt: number): void {
		this.keyboardConfig(dt);
		this.player.update(dt);
	}

	public override onResize(_newW: number, _newH: number): void {
		this.interactiveScreen.width = _newW;
		this.interactiveScreen.height = _newH;
		// this.background.height = _newH * 1.2;
		this.background.scale.x = this.background.scale.y;
	}
}
