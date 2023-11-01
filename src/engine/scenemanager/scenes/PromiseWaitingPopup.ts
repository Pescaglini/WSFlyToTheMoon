import { Easing, Tween } from "tweedle.js";
import { Graphics } from "@pixi/graphics";
import { CircularGradientProgress } from "../../ui/progressbar/CircularGradientProgress";
import { ScaleHelper } from "../../utils/ScaleHelper";
import { PixiScene } from "./PixiScene";

/**
 * Super simple popup that shows a spinning thingy while a promise is pending.
 * Useful for scenes or popups or any other fetch related stuff.
 * It waits a bit before showing itself, so if the promise resolves quickly, it won't even show.
 * this also blocks the inputs, so you can't click anything while it's open.
 */
export class PromiseWaitingPopup extends PixiScene {
	private readonly fade: Graphics;
	private readonly spinner: CircularGradientProgress;
	public constructor(promise: Promise<unknown> | Promise<unknown>[]) {
		super();
		this.fade = new Graphics();
		this.fade.interactive = true;
		this.fade.alpha = 0;

		const spinnerSettings = {
			colors: [
				{ color: 0xffffff, stop: 0, alpha: 0 },
				{ color: 0xffffff, stop: 0.25, alpha: 1 },
			],
			innerRadius: 300,
			outerRadius: 400,
			anchorX: 0.5,
			anchorY: 0.5,
			endCap: false,
			startCap: false,
			initialValue: 0.75,
		};

		this.spinner = new CircularGradientProgress(spinnerSettings);
		this.spinner.alpha = 0;

		this.addChild(this.fade);
		this.addChild(this.spinner);

		if (!Array.isArray(promise)) {
			promise = [promise];
		}

		Promise.all(promise).finally(() => this.closeHandler);
	}

	public override onStart(): void {
		new Tween(this.fade, this.tweens).to({ alpha: 0.5 }, 100).delay(50).easing(Easing.Linear.None).start();
		new Tween(this.spinner, this.tweens).to({ alpha: 1 }, 50).delay(100).easing(Easing.Linear.None).start();
	}

	public override update(dt: number): void {
		this.spinner.angle += dt * 0.1;
	}

	public override onResize(w: number, h: number): void {
		this.fade.clear();
		this.fade.beginFill(0x000011, 1);
		this.fade.drawRect(0, 0, w, h);
		this.fade.endFill();

		ScaleHelper.setScaleRelativeToScreen(this.spinner, w, h, 0.5, 0.25);
		this.spinner.x = w / 2;
		this.spinner.y = h / 2;
	}
}
