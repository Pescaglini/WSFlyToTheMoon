import { AnimatedSprite } from "@pixi/sprite-animated";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";
import { Easing, Tween } from "tweedle.js";
import { TilingSprite } from "@pixi/sprite-tiling";

export class MenuScene extends PixiScene {
	public static readonly BUNDLES = ["img"];
	private background: Sprite;
	private backgroundCardboard: TilingSprite;
	private pin1: Sprite;
	private pin2: Sprite;
	private pin3: Sprite;
	private tape: Sprite;
	private title: AnimatedSprite;
	private playButton: AnimatedSprite;

	constructor() {
		super();
		this.background = Sprite.from("menuUI/bgPaperMenu.png");
		this.background.anchor.set(0.5);

		this.backgroundCardboard = new TilingSprite(Texture.from("menuUI/cardboard.png"), 1920, 1080);
		this.backgroundCardboard.anchor.set(0.5);

		this.pin1 = Sprite.from("menuUI/pin1.png");
		this.pin1.anchor.set(0.5);
		this.pin1.scale.set(0.4);
		this.pin1.position.set(-this.background.width * 0.5 + this.pin1.width * 0.6, -this.background.height * 0.5 + this.pin1.height * 0.6);
		this.pin2 = Sprite.from("menuUI/pin2.png");
		this.pin2.anchor.set(0.5);
		this.pin2.position.set(this.background.width * 0.5 - this.pin2.width * 0, -this.background.height * 0.5 + this.pin2.height * 0.6);
		this.pin2.scale.set(0.5);
		this.pin3 = Sprite.from("menuUI/pin2.png");
		this.pin3.anchor.set(0.5);
		this.pin3.scale.set(0.5);
		this.pin3.angle = 270;
		this.pin3.position.set(-this.background.width * 0.5 + this.pin3.width * 0.6, this.background.height * 0.5 - this.pin3.height * 0.6);
		this.tape = Sprite.from("menuUI/tape1.png");
		this.tape.anchor.set(0.5);
		this.tape.angle = 160;
		this.tape.position.set(this.background.width * 0.5 + this.pin3.width * 0, this.background.height * 0.5 - this.pin3.height * 0.5);

		this.title = new AnimatedSprite([Texture.from("menuUI/SOC_title_1.png"), Texture.from("menuUI/SOC_title_2.png")], false);
		this.title.anchor.set(0.5);
		this.title.play();
		this.title.position.set(0, -this.background.height * 0.25);
		this.title.height = this.background.height * 0.4;
		this.title.scale.x = this.title.scale.y;

		this.playButton = new AnimatedSprite([Texture.from("menuUI/playButton1.png"), Texture.from("menuUI/playButton2.png"), Texture.from("menuUI/playButton3.png")], false);
		this.playButton.anchor.set(0.5);
		this.playButton.play();
		this.playButton.height = this.background.height * 0.2;
		this.playButton.scale.x = this.playButton.scale.y;
		this.playButton.position.set(0, this.background.height * 0.25);
		this.playButton.eventMode = "dynamic";
		this.playButton.on("mouseover", () => {
			this.playButton.scale.set(this.playButton.scale.x + 0.15);
		});
		this.playButton.on("mouseleave", () => {
			this.playButton.scale.set(this.playButton.scale.x - 0.15);
		});
		this.playButton.once("mousedown", () => {
			console.log("wea");
			this.passPage();
		});

		this.addChild(this.backgroundCardboard, this.background);
		this.background.addChild(this.title, this.playButton, this.pin1, this.pin2, this.pin3, this.tape);
	}

	private passPage(): void {
		new Tween(this.background)
			.to({ position: { x: -this.backgroundCardboard.width } }, 3000)
			.easing(Easing.Back.InOut)
			.start();
		new Tween(this.backgroundCardboard)
			.from({ tilePosition: { x: 0 } })
			.to({ tilePosition: { x: -this.backgroundCardboard.width } }, 3000)
			.easing(Easing.Back.InOut)
			.start();
	}

	public override update(_dt: number): void {
		this.title.update(_dt * 0.005);
		this.playButton.update(_dt * 0.01);
	}

	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.background, _newW, _newH, 1, 1, ScaleHelper.FIT);
		ScaleHelper.setScaleRelativeToScreen(this.backgroundCardboard, _newW, _newH, 1, 1, ScaleHelper.FILL);
		this.background.position.set(_newW / 2, _newH / 2);

		this.backgroundCardboard.position.set(_newW / 2, _newH / 2);
	}
}
