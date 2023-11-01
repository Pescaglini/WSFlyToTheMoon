import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { Sprite } from "@pixi/sprite";
import { Point } from "@pixi/core";
import { lerp } from "../../../engine/utils/MathUtils";
import { HitPoly } from "../../../engine/collision/HitPoly";
import type { DisplayObject } from "@pixi/display";
import { Container } from "@pixi/display";
import { Hit } from "../../../engine/collision/Hit";
import { Response } from "sat";
import { GraphicsHelper } from "../../../engine/utils/GraphicsHelper";
import { HitCircle } from "../../../engine/collision/HitCircle";
import type { Graphics } from "@pixi/graphics";
import type { IHitable } from "../../../engine/collision/IHitable";
import type { FederatedPointerEvent } from "@pixi/events";

export class CollisionScene extends PixiScene {
	public static readonly BUNDLES = ["img"];

	private currentlyDragging: DisplayObject;
	private draggingOffset: Point;

	private sprs: Sprite[] = [];
	private hitboxes: (Graphics & IHitable)[] = [];
	private debugContainer = new Container();
	constructor() {
		super();

		const instructions = new Text(i18next.t("demos.sat.instructions"), new TextStyle({ fill: "white", fontFamily: "Arial Rounded MT" }));
		instructions.x = 100;
		this.addChild(instructions);

		/**
		 * Collisions using SAT.
		 * Consider encapsulating the graphics and the HitPoly in an object.
		 */

		// * A simple square hitbox ------------------------------------------------
		let spr = Sprite.from("package-1/bronze_1.png");
		spr.x = 100;
		spr.y = 100;
		let hitbox = HitPoly.makeBox(0, 0, spr.width, spr.height, true);
		spr.addChild(hitbox);
		this.hitboxes.push(hitbox);
		this.sprs.push(spr);

		// * A regular poligon, friendly called a "muchogono". Looks like a circle ------------------------------------------------
		spr = Sprite.from("package-1/bronze_1.png");
		spr.x = 200;
		spr.y = 200;
		hitbox = HitPoly.makeRegular(16, spr.width / 2, 0, true);
		hitbox.position.set(spr.width / 2, spr.height / 2);
		spr.addChild(hitbox);
		this.hitboxes.push(hitbox);
		this.sprs.push(spr);

		// * Another "muchogono" ------------------------------------------------
		spr = Sprite.from("package-1/bronze_1.png");
		spr.x = 500;
		spr.y = 200;
		hitbox = HitPoly.makeRegular(16, spr.width / 2, 0, true);
		hitbox.position.set(spr.width / 2, spr.height / 2);
		spr.addChild(hitbox);
		this.hitboxes.push(hitbox);
		this.sprs.push(spr);

		// * A regular poligon with less sides ------------------------------------------------
		spr = Sprite.from("package-1/bronze_1.png");
		spr.x = 300;
		spr.y = 300;
		hitbox = HitPoly.makeRegular(5, spr.width / 2, 0, true);
		hitbox.position.set(spr.width / 2, spr.height / 2);
		spr.addChild(hitbox);
		this.hitboxes.push(hitbox);
		this.sprs.push(spr);

		// * A circle. This uses the HitCircle class ------------------------------------------------
		spr = Sprite.from("package-1/bronze_1.png");
		spr.x = 600;
		spr.y = 300;
		let hitCircle = new HitCircle(spr.width / 2, true);
		hitCircle.position.set(spr.width / 2, spr.height / 2);
		spr.addChild(hitCircle);
		this.hitboxes.push(hitCircle);
		this.sprs.push(spr);

		// * Another circle ------------------------------------------------
		spr = Sprite.from("package-1/bronze_1.png");
		spr.x = 600;
		spr.y = 600;
		hitCircle = new HitCircle(spr.width / 2, true);
		hitCircle.position.set(spr.width / 2, spr.height / 2);
		spr.addChild(hitCircle);
		this.hitboxes.push(hitCircle);
		this.sprs.push(spr);

		// * A really ugly concave shape ------------------------------------------------
		spr = Sprite.from("package-1/bronze_1.png");
		spr.x = 100;
		spr.y = 600;
		// make a star shaped hitbox
		hitbox = new HitPoly(
			[
				// make a pentagram star
				new Point(0, 0),
				new Point(175, 0),
				new Point(175, 0.1 * 175),
				new Point(0.1 * 175, 0.1 * 175),
				new Point(0.1 * 175, 0.9 * 175),
				new Point(175, 0.9 * 175),
				new Point(175, 175),
				new Point(0, 175),
			],
			true
		);
		spr.addChild(hitbox);
		this.hitboxes.push(hitbox);
		this.sprs.push(spr);

		// Add everything to screen
		this.addChild(...this.sprs);

		this.makeDemoContols();

		this.addChild(this.debugContainer);
	}

	public override update(): void {
		// Clear the debug container
		this.debugContainer.removeChildren().forEach((c) => c.destroy());
		this.sprs.forEach((s) => (s.tint = 0xffffff));

		// Only create a response object if you plan on using the overlapping vectors
		const result: Response = new Response(); // OPTIONAL
		// Check everything against everything.
		for (let i = 0; i < this.hitboxes.length; i++) {
			for (let j = 0; j < this.hitboxes.length; j++) {
				// Get the hitboxes and the sprites.
				const hitA = this.hitboxes[i];
				const hitB = this.hitboxes[j];
				const sprA = this.sprs[i];
				const sprB = this.sprs[j];

				// Do not check collision against itself.
				if (hitA !== hitB) {
					// The test method returns true if hit and then inside result there is extra info
					//* This is the important function
					const wasHit = Hit.test(hitA, hitB, result);
					if (wasHit) {
						// Tint blue for debug
						sprA.tint = 0x0000ff;
						sprB.tint = 0x0000ff;

						// Read the values inside result to draw debug arrows.
						const overlapGraphic = GraphicsHelper.arrow({
							x: result.overlapN.x,
							y: result.overlapN.y,
							magnitude: result.overlap,
						});
						overlapGraphic.position.copyFrom(hitA.getGlobalPosition());
						this.debugContainer.addChild(overlapGraphic);

						const overlapGraphicLong = GraphicsHelper.arrow({
							x: result.overlapN.x,
							y: result.overlapN.y,
							magnitude: 50,
						});
						overlapGraphicLong.position.copyFrom(hitA.getGlobalPosition());
						this.debugContainer.addChild(overlapGraphicLong);
					}
				}
			}
		}
	}

	// #region Demo Controls - Feel free to ignore
	private makeDemoContols(): void {
		this.draggingOffset = new Point();
		for (const draggable of this.sprs) {
			draggable.interactive = true;

			// start drag on pointerdown
			draggable.on("pointerdown", (event: FederatedPointerEvent) => {
				const downPosition = draggable.parent.toLocal(event);
				this.draggingOffset.x = draggable.position.x - downPosition.x;
				this.draggingOffset.y = draggable.position.y - downPosition.y;
				this.currentlyDragging = draggable;
			});

			// end drag on pointerup OR pointerupoutside because of the smoothing we might release outside the object!
			draggable.on("pointerup", this.endDrag, this);
			draggable.on("pointerupoutside", this.endDrag, this);

			// move drag on pointermove
			draggable.on("pointermove", (event: FederatedPointerEvent) => {
				if (this.currentlyDragging) {
					const newPosition = draggable.parent.toLocal(event);
					const violenceFactor = 0.5; // 1 = no smooth. 0 = so smooth it won't move.
					this.currentlyDragging.x = lerp(this.currentlyDragging.x, newPosition.x + this.draggingOffset.x, violenceFactor);
					this.currentlyDragging.y = lerp(this.currentlyDragging.y, newPosition.y + this.draggingOffset.y, violenceFactor);
				}
			});

			window.addEventListener("wheel", (event: WheelEvent) => {
				if (this.currentlyDragging) {
					this.currentlyDragging.angle += event.deltaY * 0.01;
				}
			});
		}
	}

	private endDrag(event: FederatedPointerEvent): void {
		if (this.currentlyDragging) {
			const newPosition = this.currentlyDragging.parent.toLocal(event);
			this.currentlyDragging.x = newPosition.x + this.draggingOffset.x;
			this.currentlyDragging.y = newPosition.y + this.draggingOffset.y;
			this.currentlyDragging = undefined;
		}
	}
	// #endregion
}
