import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { Sprite } from "@pixi/sprite";
import { Tween } from "tweedle.js";

export class TweenScene extends PixiScene {
	public static readonly BUNDLES = ["img"];
	constructor() {
		super();

		const instructions = new Text(i18next.t("demos.tween.instructions"), new TextStyle({ fill: "white", fontFamily: "Arial Rounded MT" }));
		instructions.x = 100;
		this.addChild(instructions);

		const sprPositionExample = Sprite.from("package-1/bronze_1.png");
		sprPositionExample.x = 100;
		sprPositionExample.y = 100;
		this.addChild(sprPositionExample);

		const sprScaleExample = Sprite.from("package-1/bronze_1.png");
		sprScaleExample.x = 100;
		sprScaleExample.y = 200;
		this.addChild(sprScaleExample);

		const sprComplexExample = Sprite.from("package-1/bronze_1.png");
		sprComplexExample.x = 100;
		sprComplexExample.y = 500;
		this.addChild(sprComplexExample);

		/**
		 * Tweening example.
		 * Tweening is a way to animate properties by changing them over time.
		 * Just tell it what you want to change, and how long you want it to take.
		 */

		// This is the looooooong way of making a tween
		const t = new Tween(sprPositionExample); // Create the tween attached to the object
		t.to({ x: 500 }, 2000); // Describe the destination properties
		t.repeat(Infinity); // Amount of times to repeat
		t.yoyo(true); // Inverts the tween every other loop. Makes a ping-pong, or yo-yo effect
		t.start(); // REMEMBER THIS! This fires the tween!

		// This is a shorter way of making a tween: We don't declare a variable but instead chain-call the methods.
		new Tween(sprScaleExample)
			.to({ scale: { x: 2, y: 2 } }, 2000) // You can reach deep objects if you have the target object
			.repeat(Infinity)
			.yoyo(true)
			.start();

		// You can tween any property that is a number in a single tween
		new Tween(sprComplexExample)
			.to({ x: 500, y: 600, scale: { x: 2 }, angle: 270 }, 1000)
			.repeat(Infinity)
			.yoyo(true)
			.start();
	}
}
