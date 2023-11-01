import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { Sprite } from "@pixi/sprite";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import { Container } from "@pixi/display";
import { EraseFilter } from "../../../engine/filters/erase/EraseFilter";
import { BlurMaskFilter } from "../../../engine/filters/blurMask/BlurMaskFilter";
import { Texture } from "@pixi/core";

export class SpriteMaskDemoScene extends PixiScene {
	public static readonly BUNDLES = ["img"];

	private resizeContaier: Container;
	private wackyBackground: Sprite;

	constructor() {
		super();

		// Wacky background to appreciate transparency better
		this.wackyBackground = Sprite.from("img/big_placeholder/background-1.jpg");
		this.addChild(this.wackyBackground);

		this.makeDemoText();

		this.resizeContaier = new Container();
		this.addChild(this.resizeContaier);

		// Original image
		const original = Sprite.from("img/big_placeholder/bg_game.png");
		original.position.set(100, 100);
		this.resizeContaier.addChild(original);

		// Image with the mask overlayed but not used as a mask
		const originalBehind = Sprite.from("img/big_placeholder/bg_game.png");
		originalBehind.position.set(original.x + original.width + 100, 100);
		this.resizeContaier.addChild(originalBehind);
		const originalMask = Sprite.from("img/big_placeholder/mask_demo@0.5x.png");
		originalBehind.addChild(originalMask);

		const masked = Sprite.from("img/big_placeholder/bg_game.png");
		masked.position.set(100, original.y + original.height + 100);
		this.resizeContaier.addChild(masked);
		const maskyTheMask = Sprite.from("img/big_placeholder/mask_demo@0.5x.png");
		masked.addChild(maskyTheMask); // Masks MUST be children of something, anything. But it's easier if we make it children of the masked thing
		masked.mask = maskyTheMask; // this is the line.

		const maskedInverse = Sprite.from("img/big_placeholder/bg_game.png");
		maskedInverse.position.set(original.x + original.width + 100, original.y + original.height + 100);
		this.resizeContaier.addChild(maskedInverse);
		const erasyTheEraserMask = Sprite.from("img/big_placeholder/mask_demo@0.5x.png");
		maskedInverse.addChild(erasyTheEraserMask);
		maskedInverse.filters = [new EraseFilter(erasyTheEraserMask)]; // this is the line.

		const maskedBlurVisible = Sprite.from("img/big_placeholder/bg_game.png");
		maskedBlurVisible.position.set(originalBehind.x + originalBehind.width + 100, 100);
		this.resizeContaier.addChild(maskedBlurVisible);
		const blurryTheBlurMaskVisible = Sprite.from(Texture.WHITE);
		blurryTheBlurMaskVisible.position.set(128);
		blurryTheBlurMaskVisible.width = 256;
		blurryTheBlurMaskVisible.height = 256;
		maskedBlurVisible.addChild(blurryTheBlurMaskVisible);

		const maskedBlur = Sprite.from("img/big_placeholder/bg_game.png");
		maskedBlur.position.set(originalBehind.x + originalBehind.width + 100, originalBehind.y + originalBehind.height + 100);
		this.resizeContaier.addChild(maskedBlur);
		const blurryTheBlurMask = Sprite.from(Texture.WHITE);
		blurryTheBlurMask.position.set(128);
		blurryTheBlurMask.width = 256;
		blurryTheBlurMask.height = 256;
		maskedBlur.addChild(blurryTheBlurMask);
		maskedBlur.filters = [new BlurMaskFilter(blurryTheBlurMask)]; // this is the line.
	}

	/**
	 * We have a lot of images to show. Simple resize to make sure we see them all
	 */
	public override onResize(newW: number, newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.wackyBackground, newW, newH, 1, 1, ScaleHelper.FILL);
		ScaleHelper.setScaleRelativeToScreen(this.resizeContaier, newW, newH, 0.8, 0.8, ScaleHelper.FIT);
	}

	/**
	 * Method to make the text explaining the demo. Nothing to see here.
	 */
	private makeDemoText(): void {
		const textStyle = new TextStyle({
			fill: "white",
			fontFamily: "Arial Rounded MT",
			stroke: "black",
			strokeThickness: 10,
			lineJoin: "round",
		});

		const instructions = new Text(i18next.t("demos.mask.instructions"), textStyle);
		instructions.x = 100;
		this.addChild(instructions);
	}
}
