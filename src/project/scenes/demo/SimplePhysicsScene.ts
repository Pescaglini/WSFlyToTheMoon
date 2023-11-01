import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { Sprite } from "@pixi/sprite";
import { Point } from "@pixi/core";
import { Manager } from "../../..";

export class SimplePhysicsScene extends PixiScene {
	public static readonly BUNDLES = ["img"];
	private speed: Point;
	private acceleration: Point;
	private spr: Sprite;

	constructor() {
		super();

		const instructions = new Text(i18next.t("demos.physics.instructions"), new TextStyle({ fill: "white", fontFamily: "Arial Rounded MT" }));
		instructions.x = 100;
		this.addChild(instructions);

		/**
		 * Simple physics example. This uses a SUPER simple verlet integration. More commonly called "Physics 1" in the office
		 * If you need real physics simulation you will need Box2D wasm. Ask Milton.
		 * If you have lots of physics object, encapsulate the behaviour in a class and inherit or compose from/with that.
		 */
		this.spr = Sprite.from("package-1/bronze_1.png");
		this.addChild(this.spr);

		this.speed = new Point(0, 0);
		this.acceleration = new Point(0, 0.01);

		this.speed.set(2, 1.5);
	}

	public override update(dt: number): void {
		this.spr.x = this.spr.x + this.speed.x * dt + (this.acceleration.x / 2) * dt * dt;
		this.spr.y = this.spr.y + this.speed.y * dt + (this.acceleration.y / 2) * dt * dt;
		this.speed.x = this.speed.x + this.acceleration.x * dt;
		this.speed.y = this.speed.y + this.acceleration.y * dt;

		// Naive way of keeping the sprite in the screen
		// ! Do not use as is, please 😢
		if (this.spr.x > Manager.width) {
			this.spr.x = Manager.width;
			this.speed.x = -Math.random() - 1;
		}
		if (this.spr.x < 0) {
			this.spr.x = 0;
			this.speed.x = Math.random() + 1;
		}
		if (this.spr.y > Manager.height) {
			this.spr.y = Manager.height;
			this.speed.y = -Math.random() * 2 - 2;
		}
	}
}
