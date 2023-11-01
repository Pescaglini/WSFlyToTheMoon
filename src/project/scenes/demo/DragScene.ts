import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { Sprite } from "@pixi/sprite";
import { Point } from "@pixi/core";
import { lerp } from "../../../engine/utils/MathUtils";
import type { FederatedPointerEvent } from "@pixi/events";

export class DragScene extends PixiScene {
	public static readonly BUNDLES = ["img"];
	private isDragging: boolean;
	private draggingOffset: Point;
	private draggable: Sprite;
	constructor() {
		super();

		const instructions = new Text(i18next.t("demos.drag.instructions"), new TextStyle({ fill: "white", fontFamily: "Arial Rounded MT" }));
		instructions.x = 100;
		this.addChild(instructions);

		/**
		 * this.Draggable object example. This is overly verbose for explanation purposes. Feel free to write more consise code.
		 * Also, consider encapsulating the logic into a class that fits your project.
		 */
		this.isDragging = false; // Whether the object is currently being dragged. It will follow the mouse only if true.
		this.draggingOffset = new Point(); // The offset between the mouse and the object, this allows you to drag exactly from where you clicked.
		this.draggable = Sprite.from("package-1/bronze_1.png");
		this.draggable.x = 300;
		this.draggable.y = 300;
		this.draggable.interactive = true;

		// start drag on pointerdown
		this.draggable.on("pointerdown", this.beginDrag, this);

		// end drag on pointerup OR pointerupoutside because of the smoothing we might release outside the object!
		this.draggable.on("pointerup", this.endDrag, this);
		this.draggable.on("pointerupoutside", this.endDrag, this);

		// move drag on pointermove, with global you're able to drag with the pointer outside the object
		this.draggable.on("globalpointermove", this.moveDrag, this);

		this.addChild(this.draggable);
	}

	/**
	 * START THE DRAG: On down we set the dragging to true and store the offset between the mouse and the object.
	 */
	private beginDrag(event: FederatedPointerEvent): void {
		// This is to correct after so we can drag from the exact position where we clicked.
		const downPosition = this.draggable.parent.toLocal(event);
		this.draggingOffset.x = this.draggable.position.x - downPosition.x;
		this.draggingOffset.y = this.draggable.position.y - downPosition.y;

		// Set the dragging to true.
		this.isDragging = true;
	}

	/**
	 * END THE DRAG: On up we set the dragging to false and just in case we set the position.
	 */
	private endDrag(event: FederatedPointerEvent): void {
		// Finish dragging.
		this.isDragging = false;

		// Snap to drop location just in case. (to compensate smoothing)
		const newPosition = this.draggable.parent.toLocal(event);
		this.draggable.x = newPosition.x + this.draggingOffset.x;
		this.draggable.y = newPosition.y + this.draggingOffset.y;
	}

	/**
	 * DURING DRAG: We just make the object follow the pointer IF the dragging is true.
	 */
	private moveDrag(event: FederatedPointerEvent): void {
		if (this.isDragging) {
			// This is to correct after so we can drag from the exact position where we clicked.
			const newPosition = this.draggable.parent.toLocal(event);
			const violenceFactor = 0.5; // 1 = no smooth. 0 = so smooth it won't move.
			this.draggable.x = lerp(this.draggable.x, newPosition.x + this.draggingOffset.x, violenceFactor);
			this.draggable.y = lerp(this.draggable.y, newPosition.y + this.draggingOffset.y, violenceFactor);
		}
	}
}
