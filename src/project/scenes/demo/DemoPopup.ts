import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import i18next from "i18next";
import { Container } from "@pixi/display";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import { Graphics } from "@pixi/graphics";
import { Sprite } from "@pixi/sprite";
import { Button } from "../../../engine/ui/button/Button";
import { Easing, Tween } from "tweedle.js";

/**
 * ! A popup is just a regular scene 🤯
 */
export class DemoPopup extends PixiScene {
	public static readonly BUNDLES = ["img"];
	private fadeAndBlocker: Graphics;
	private resizeContainer: Container;
	private tweenContainer: Container;
	constructor() {
		super();

		// A gray background to block the clicks and dim the screen.
		this.fadeAndBlocker = new Graphics();
		this.fadeAndBlocker.beginFill(0x000000, 0.5); // chose color and opacity of the fade
		this.fadeAndBlocker.drawRect(0, 0, 1, 1); // Size is one pixel, will be resized on resize
		this.fadeAndBlocker.endFill();
		this.fadeAndBlocker.interactive = true; // Make interactive to "block" the clicks outside the popup
		this.addChild(this.fadeAndBlocker);

		// This will be resized and centered in the onResize.
		this.resizeContainer = new Container();
		this.addChild(this.resizeContainer);

		// This will tween the scale from 0 to 1
		// all the children of this container will inherit that animation
		this.tweenContainer = new Container();
		this.resizeContainer.addChild(this.tweenContainer);

		// Build the popup. Forget about scales, they are inherited from the resizeContainer
		const background = Sprite.from("ui-placeholder-demo/TutorialBody.png");
		// I change the position instead of using anchor to keep the zero at the top-left corner of the popup body.
		// It makes it a bit easier to position objects inside it
		background.x = -background.width / 2;
		background.y = -background.height / 2;
		this.tweenContainer.addChild(background);

		const auxTextstyle = new TextStyle({
			fill: "white",
			fontFamily: "Arial Rounded MT",
			stroke: "black",
			strokeThickness: 5,
			lineJoin: "round",
			fontSize: 32,
		});

		const title = new Text(i18next.t("demos.ui.popup.title"), auxTextstyle);
		title.anchor.set(0.5);
		title.x = background.width / 2;
		title.y = 155;
		background.addChild(title);

		const multilineStyle = auxTextstyle.clone();
		multilineStyle.wordWrap = true;
		multilineStyle.wordWrapWidth = 480;
		multilineStyle.fontSize = 30;

		const body = new Text(i18next.t("demos.ui.popup.body"), multilineStyle);
		body.anchor.set(0.5, 0);
		body.x = background.width / 2;
		body.y = 190;
		background.addChild(body);

		// This is the advanced way of using "Button".
		const buttonTextStyle = auxTextstyle.clone();
		buttonTextStyle.fontSize = 100;
		buttonTextStyle.strokeThickness = 20;
		const button = new Button({
			clickOnce: true,
			defaultState: {
				texture: "ui-placeholder-demo/TutorialButton.png",
				text: {
					content: i18next.t("demos.ui.popup.close"),
					style: buttonTextStyle,
				},
			},
			highlightState: { scale: 1.03 },
			downState: { scale: 0.97 },
			onClick: () => this.requestClose(),
		});
		button.x = background.width / 2;
		button.y = 539;
		background.addChild(button);
	}

	public override onStart(): void {
		// Start is the first update before rendering.
		// We set up and fire our tweens here because onResize was called right before this, so we are sure we have good sizes.

		this.tweenContainer.interactiveChildren = false; // Prevent clicking the buttons during the animation.

		this.fadeAndBlocker.alpha = 0;
		this.tweenContainer.scale.set(0);

		const fadeAnimation = new Tween(this.fadeAndBlocker).to({ alpha: 1 }, 500);

		const elasticAnimaton = new Tween(this.tweenContainer).to({ scale: { x: 1, y: 1 } }, 1000).easing(Easing.Elastic.Out);

		elasticAnimaton.onComplete(() => (this.tweenContainer.interactiveChildren = true)); // Re-enable clicking the buttons after the animation.
		fadeAnimation.chain(elasticAnimaton);
		fadeAnimation.start();
	}

	public override onResize(newW: number, newH: number): void {
		// it's just a pixel and we resize it to cover the whole screen;
		this.fadeAndBlocker.width = newW;
		this.fadeAndBlocker.height = newH;

		// Resize the resize container and call it a day.
		ScaleHelper.setScaleRelativeToScreen(this.resizeContainer, newW, newH, 0.6, 0.6, ScaleHelper.FIT);
		this.resizeContainer.x = newW / 2;
		this.resizeContainer.y = newH / 2;
	}

	public override requestClose(): Promise<boolean> {
		// This is called when the popup is requested to close. Either himself or somebody from the outside might request a nice exit.
		// If somebody from outside wants to request a non-nice exit, they can just call `closeHandler()` directly.

		return new Promise((resolve) => {
			// The important function is `this.closeHandler()`. We make a nice animation before calling it.

			this.tweenContainer.interactiveChildren = false; // Prevent clicking the buttons during the animation.

			const fadeAnimation = new Tween(this.fadeAndBlocker).to({ alpha: 0 }, 500);
			const elasticAnimaton = new Tween(this.tweenContainer).to({ scale: { x: 0, y: 0 } }, 1000).easing(Easing.Elastic.In);

			fadeAnimation.onComplete(() => {
				this.closeHandler(); // this.closeHandler() is the magic word for closing and destroying a popup!
				resolve(true); // True to report that we did close successfully.
			});

			elasticAnimaton.chain(fadeAnimation);
			elasticAnimaton.start();
		});
	}
}
