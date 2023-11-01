import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { Sprite } from "@pixi/sprite";
import { Manager } from "../../..";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";

export class ResizeFundamentalsScene extends PixiScene {
	public static readonly BUNDLES = ["img"];
	private background: Sprite;

	private currentResizeMode: "original" | "fit" | "fill" = "original";
	private explanationLabel: Text;

	constructor() {
		super();

		this.makeDemoText();

		this.background = Sprite.from("img/big_placeholder/bg_game.png");
		this.background.anchor.set(0.5, 0.5);
		this.addChildAt(this.background, 0);
	}

	public override onResize(newW: number, newH: number): void {
		// Demo only. Make sure the text stays on screen.
		this.explanationLabel.x = newW - 10;
		this.explanationLabel.y = newH - 10;

		//* This is the good stuff
		// Set the background position to the middle of the screen
		this.background.position.set(newW / 2, newH / 2);

		// * How does the "setScaleRelativeToScreen" work.
		// It will ask for a "factorOfScreen"
		// 1 = The same size as the screen.
		// 0.5 = Half the size of the screen.
		// 0.25 = A quarter of the size of the screen.
		// etc.

		// Different ways to resize:
		switch (this.currentResizeMode) {
			case "fill":
				// Fill will make sure you never see the background/black bars. But you might lose part of the image.
				ScaleHelper.setScaleRelativeToScreen(this.background, newW, newH, 1, 1, ScaleHelper.FILL);
				break;
			case "fit":
				// Fit will make sure you never leave any part of the image outside the screen but you might see the background/black bars
				ScaleHelper.setScaleRelativeToScreen(this.background, newW, newH, 1, 1, ScaleHelper.FIT);
				break;
			case "original":
				// Do nothing. Sets the scale to always be 1 and never resizes. This will look ugly most if not all the times.
				this.background.scale.set(1, 1);
				break;
		}
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

		const instructions = new Text(i18next.t("demos.resize.instructions"), textStyle);
		instructions.x = 100;
		this.addChild(instructions);

		this.explanationLabel = new Text(i18next.t("demos.resize.original"), textStyle.clone());
		this.explanationLabel.style.wordWrap = true;
		this.explanationLabel.style.wordWrapWidth = 400;
		this.explanationLabel.anchor.set(1, 1);
		this.addChild(this.explanationLabel);

		const originalButton = new Text(i18next.t("demos.resize.buttonOriginal"), textStyle);
		originalButton.x = instructions.x;
		originalButton.y = instructions.y + instructions.height + 20;
		originalButton.interactive = true;
		originalButton.on("pointerdown", () => {
			this.currentResizeMode = "original";
			this.explanationLabel.text = i18next.t("demos.resize.original");
			this.onResize(Manager.width, Manager.height); // Manually firing resize because we changed the resize mode. You shouldn't need to call onResize Manually.
		});
		this.addChild(originalButton);

		const fitButton = new Text(i18next.t("demos.resize.buttonFit"), textStyle);
		fitButton.x = originalButton.x;
		fitButton.y = originalButton.y + originalButton.height + 20;
		fitButton.interactive = true;
		fitButton.on("pointerdown", () => {
			this.currentResizeMode = "fit";
			this.explanationLabel.text = i18next.t("demos.resize.fit");
			this.onResize(Manager.width, Manager.height); // Manually firing resize because we changed the resize mode. You shouldn't need to call onResize Manually.
		});
		this.addChild(fitButton);

		const fillButton = new Text(i18next.t("demos.resize.buttonFill"), textStyle);
		fillButton.x = originalButton.x;
		fillButton.y = fitButton.y + fitButton.height + 20;
		fillButton.interactive = true;
		fillButton.on("pointerdown", () => {
			this.currentResizeMode = "fill";
			this.explanationLabel.text = i18next.t("demos.resize.fill");
			this.onResize(Manager.width, Manager.height); // Manually firing resize because we changed the resize mode. You shouldn't need to call onResize Manually.
		});
		this.addChild(fillButton);
	}
}
