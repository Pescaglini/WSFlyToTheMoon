import { AnimatedSprite } from "@pixi/sprite-animated";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";
import { Easing, Tween } from "tweedle.js";
import { TilingSprite } from "@pixi/sprite-tiling";
import { Container } from "@pixi/display";
import { EventEmitter } from "@pixi/utils";

export class MenuScene extends PixiScene {
	public static readonly BUNDLES = ["img"];
	private pagesContainer: Container;
	private currentPageIndex: number;
	private title: AnimatedSprite;
	private playButton: AnimatedSprite;
	private backgroundCardboard: TilingSprite;
	public evt = new EventEmitter();

	constructor() {
		super();
		this.backgroundCardboard = new TilingSprite(Texture.from("menuUI/cardboard.png"), 1920, 1080);

		this.currentPageIndex = 0;
		this.pagesContainer = new Container();
		this.pagesConfig();
	}

	private pagesConfig(): void {
		// Title Page
		const titlePage = Sprite.from("menuUI/bgPaperMenu.png");
		titlePage.anchor.set(0.5);
		titlePage.x = titlePage.texture.width * 0.6;

		const pin1 = Sprite.from("menuUI/pin1.png");
		pin1.anchor.set(0.5);
		pin1.scale.set(0.4);
		pin1.position.set(-titlePage.width * 0.5 + pin1.width * 0.6, -titlePage.height * 0.5 + pin1.height * 0.6);
		const pin2 = Sprite.from("menuUI/pin2.png");
		pin2.anchor.set(0.5);
		pin2.position.set(titlePage.width * 0.5 - pin2.width * 0, -titlePage.height * 0.5 + pin2.height * 0.6);
		pin2.scale.set(0.5);
		const pin3 = Sprite.from("menuUI/pin2.png");
		pin3.anchor.set(0.5);
		pin3.scale.set(0.5);
		pin3.angle = 270;
		pin3.position.set(-titlePage.width * 0.5 + pin3.width * 0.6, titlePage.height * 0.5 - pin3.height * 0.6);
		const tape = Sprite.from("menuUI/tape1.png");
		tape.anchor.set(0.5);
		tape.angle = 160;
		tape.position.set(titlePage.width * 0.5 + pin3.width * 0, titlePage.height * 0.5 - pin3.height * 0.5);

		this.title = new AnimatedSprite([Texture.from("menuUI/SOC_title_1.png"), Texture.from("menuUI/SOC_title_2.png")], false);
		this.title.anchor.set(0.5);
		this.title.play();
		this.title.position.set(0, -titlePage.height * 0.25);
		this.title.height = titlePage.height * 0.4;
		this.title.scale.x = this.title.scale.y;

		this.playButton = new AnimatedSprite([Texture.from("menuUI/playButton1.png"), Texture.from("menuUI/playButton2.png"), Texture.from("menuUI/playButton3.png")], false);
		this.playButton.anchor.set(0.5);
		this.playButton.play();
		this.playButton.height = titlePage.height * 0.2;
		this.playButton.scale.x = this.playButton.scale.y;
		this.playButton.position.set(0, titlePage.height * 0.25);
		this.playButton.eventMode = "dynamic";
		this.playButton.on("mouseover", () => {
			this.playButton.scale.set(this.playButton.scale.x + 0.15);
		});
		this.playButton.on("mouseleave", () => {
			this.playButton.scale.set(this.playButton.scale.x - 0.15);
		});
		this.playButton.once("mousedown", () => {
			console.log("wea");
			this.passPage(this.currentPageIndex);
		});
		titlePage.addChild(this.title, this.playButton, pin1, pin2, pin3, tape);
		this.pagesContainer.addChild(titlePage);

		// Saves Page
		const savesPage = Sprite.from("menuUI/bgPaperMenu.png");
		savesPage.anchor.set(0.5);
		savesPage.x = titlePage.x + savesPage.texture.width * 1.2;
		this.pagesContainer.addChild(savesPage);
		const saveFileTitle = Sprite.from("menuUI/saveFilesTitle.png");
		saveFileTitle.anchor.set(0.5);
		saveFileTitle.position.set(0, -savesPage.height * 0.25);
		savesPage.addChild(saveFileTitle);

		const hand = Sprite.from("menuUI/hand.png");
		hand.anchor.set(0, 0.5);
		hand.angle = 90;
		hand.visible = false;
		const saveFileImage = Sprite.from("menuUI/saveFileImage2.png");
		saveFileImage.anchor.set(0.5);
		saveFileImage.scale.set(0.5);
		saveFileImage.visible = false;

		let imagePlace = false;

		this.evt.on("SaveHandPlacing", () => {
			savesPage.addChild(saveFileImage);
			savesPage.addChild(hand);
			new Tween(hand)
				.onStart(() => {
					hand.visible = true;
					saveFileImage.visible = true;
				})
				.onUpdate(() => {
					if (!imagePlace) {
						saveFileImage.position = hand.position.clone();
					}
				})
				.onRepeat(() => {
					imagePlace = true;
				})
				.easing(Easing.Elastic.InOut)
				.yoyo(true)
				.repeat(1)
				.from({ position: { y: savesPage.height * 0.8 } })
				.to({ position: { y: savesPage.height * 0.1 } }, 1400)
				.start();
		});

		this.addChild(this.backgroundCardboard, this.pagesContainer);
	}

	private passPage(currentPageIndex: number): void {
		new Tween(this.pagesContainer)
			.to({ position: { x: -this.backgroundCardboard.width * (currentPageIndex + 1) } }, 3000)
			.easing(Easing.Back.InOut)
			.start()
			.onComplete(() => {
				this.evt.emit("SaveHandPlacing");
			});
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
		ScaleHelper.setScaleRelativeToScreen(this.backgroundCardboard, _newW, _newH, 1, 1, ScaleHelper.FILL);

		ScaleHelper.setScaleRelativeToScreen(this.pagesContainer, _newW, _newH, 1, 1, ScaleHelper.forceHeight);
		this.pagesContainer.position.y = _newH / 2;
	}
}
