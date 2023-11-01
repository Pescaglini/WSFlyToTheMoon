import type { DisplayObject } from "@pixi/display";
import { Container } from "@pixi/display";
import type { FederatedPointerEvent } from "@pixi/events";
import { Graphics } from "@pixi/graphics";
import { Rectangle, Point } from "@pixi/core";
import { Easing, Tween } from "tweedle.js";
import * as MathUtils from "../../utils/MathUtils";

export class ScrollView extends Container {
	public readonly content: Container;
	private readonly myMask: Graphics;

	// goldplate grab everything that is composed of an x and y, wrap inside a pixi observable point and update the layout
	public scrollWidth: number;
	public scrollHeight: number;
	public scrollVertical: boolean;
	public scrollHorizontal: boolean;

	/**
	 * Usually a rectangle of (0,0,width of the content, height of the content) will do what you want
	 */
	public scrollLimits: Rectangle;

	public bleedOut: boolean;

	private dragLastPos: Point;
	private actuallyDragging: boolean = false;
	public startDragThreshold: Point = new Point(0, 0);

	private restitutionTween: Tween<any>;
	public restitutionExtraHorizontal: number;
	public restitutionExtraVertical: number;
	public restitutionTime: number;
	public restitutionEasing: (k: number) => number;

	constructor(scrollWidth: number | "disabled", height: number | "disabled", options?: ScrollOptions) {
		super();
		this.myMask = new Graphics();
		this.content = new Container();
		this.scrollWidth = scrollWidth == "disabled" ? 1000 : scrollWidth; // the 10000 will be overwritten by the correct value before the first render, relax
		this.scrollHeight = height == "disabled" ? 1000 : height; // the 10000 will be overwritten by the correct value before the first render, relax
		this.scrollHorizontal = scrollWidth != "disabled";
		this.scrollVertical = height != "disabled";
		if (options?.addToContent) {
			Array.isArray(options.addToContent) ? options.addToContent.forEach((e) => this.content.addChild(e)) : this.content.addChild(options.addToContent);
		}
		this.scrollLimits = options?.scrollLimits; // this can be undefined, its fine
		this.startDragThreshold = options?.startDragThreshold ?? new Point(); // This can be undefined, but its better to have it initialized
		this.restitutionExtraHorizontal = options?.restitutionExtraHorizontal ?? 0;
		this.restitutionExtraVertical = options?.restitutionExtraVertical ?? 0;
		this.restitutionTime = options?.restitutionTime ?? 500;
		this.restitutionEasing = options?.restitutionEasing ?? Easing.Exponential.Out;
		this.bleedOut = Boolean(options?.bleedOut);

		this.addChild(this.myMask);
		this.addChild(this.content);
		// todo finish this shit
		// this.redrawMask();

		this.hitArea = new Rectangle();

		this.interactive = true;

		if (!options?.disableDragControls) {
			this.on("pointerdown", this.onDragStart, this);
			this.on("pointerup", this.onDragEnd, this);
			this.on("pointerupoutside", this.onDragEnd, this);
			this.on("pointerout", this.onDragEnd, this);
			this.on("pointermove", this.onDragMove, this);
		}
	}

	private onDragStart(event: FederatedPointerEvent): void {
		// store a reference to the data
		// the reason for this is because of multitouch
		// we want to track the movement of this particular touch
		this.dragLastPos = this.toLocal(event);
	}

	private onDragEnd(): void {
		// this.alpha = 1;
		// this.dragging = false;
		// // set the interaction data to null
		this.dragLastPos = null;
		this.actuallyDragging = false;
		this.content.interactiveChildren = true;
		this.constraintRectangle(true);
	}

	private onDragMove(moveEvent: FederatedPointerEvent): void {
		if (this.dragLastPos) {
			const nowPos = this.toLocal(moveEvent);
			if (!nowPos.equals(this.dragLastPos)) {
				const deltaX = nowPos.x - this.dragLastPos.x;
				const deltaY = nowPos.y - this.dragLastPos.y;
				this._scroll(deltaX, deltaY);
				if (this.actuallyDragging) {
					this.dragLastPos = nowPos;
				}
			}
		}
	}

	/**
	 * CAUTION: This won't disable the children nor check for the minimum to unlock the drag
	 */
	public scroll(distanceX: number = 0, distanceY: number = 0): void {
		distanceX = this.scrollHorizontal ? distanceX : 0;
		distanceY = this.scrollVertical ? distanceY : 0;

		this.content.x += distanceX;
		this.content.y += distanceY;
		this.constraintRectangle(false);
	}

	private _scroll(distanceX: number = 0, distanceY: number = 0): boolean {
		distanceX = this.scrollHorizontal ? distanceX : 0;
		distanceY = this.scrollVertical ? distanceY : 0;

		if (this.actuallyDragging) {
			this.content.x += distanceX;
			this.content.y += distanceY;
			this.constraintRectangle(false);
		} else {
			if (!this.startDragThreshold || Math.abs(distanceX) > this.startDragThreshold.x || Math.abs(distanceY) > this.startDragThreshold.y) {
				this.actuallyDragging = true;
				this.content.interactiveChildren = false;
			}
		}

		return this.actuallyDragging;
	}

	private constraintRectangle(allowTween: boolean): void {
		if (this.scrollLimits) {
			if (this.restitutionTween) {
				this.restitutionTween.stop();
			}

			const minLimitX = Math.max(this.scrollLimits.width - this.scrollWidth, 0);
			const minLimitY = Math.max(this.scrollLimits.height - this.scrollHeight, 0);

			this.content.x = MathUtils.clamp(
				this.content.x,
				-(minLimitX + (this.scrollHorizontal ? this.restitutionExtraHorizontal : 0)),
				-(this.scrollLimits.x - (this.scrollHorizontal ? this.restitutionExtraHorizontal : 0))
			);

			this.content.y = MathUtils.clamp(
				this.content.y,
				-(minLimitY + (this.scrollVertical ? this.restitutionExtraVertical : 0)),
				-(this.scrollLimits.y - (this.scrollVertical ? this.restitutionExtraVertical : 0))
			);
			// this.content.x = Math.min(this.content.x, -(this.scrollLimits.x - this.extraScrollWidth));
			// this.content.y = Math.min(this.content.y, -(this.scrollLimits.y - this.extraScrollHeight));
			// this.content.x = Math.max(this.content.x, -(this.scrollLimits.width - this.scrollWidth + this.extraScrollWidth));
			// this.content.y = Math.max(this.content.y, -(this.scrollLimits.height - this.scrollHeight + this.extraScrollHeight));

			if (allowTween && (this.restitutionExtraHorizontal || this.restitutionExtraVertical)) {
				const idealX = MathUtils.clamp(this.content.x, -minLimitX, -this.scrollLimits.x);
				const idealY = MathUtils.clamp(this.content.y, -minLimitY, -this.scrollLimits.y);

				const duration =
					Math.max(Math.abs(this.content.x - idealX) / (this.restitutionExtraHorizontal | 1), Math.abs(this.content.y - idealY) / (this.restitutionExtraVertical | 1)) *
					this.restitutionTime;
				this.restitutionTween = new Tween(this.content.position).to({ x: idealX, y: idealY }, duration).easing(this.restitutionEasing).start();
			}
		}
	}

	private redrawMask(): void {
		if (!this.scrollHorizontal) {
			this.scrollWidth = this.content.width;
		}
		if (!this.scrollVertical) {
			this.scrollHeight = this.content.height;
		}
		if (this.myMask.width != this.scrollWidth || this.myMask.height != this.scrollHeight) {
			this.myMask.clear();
			this.myMask.beginFill(0xff00ff, 1);
			this.myMask.drawRect(0, 0, this.scrollWidth, this.scrollHeight);
			this.myMask.endFill();
			if (this.bleedOut) {
				this.myMask.alpha = 0;
			} else {
				this.mask = this.myMask;
			}

			if (this.hitArea instanceof Rectangle) {
				this.hitArea.width = this.scrollWidth;
				this.hitArea.height = this.scrollHeight;
			}
		}
	}

	/**
	 * Hackity hack hack
	 */
	public override updateTransform(): void {
		this.redrawMask();
		super.updateTransform();
	}
}

interface ScrollOptions {
	addToContent?: DisplayObject | DisplayObject[];
	/**
	 * Usually a rectangle of (0,0,width of the content, height of the content) will do what you want
	 */
	scrollLimits?: Rectangle;
	startDragThreshold?: Point;
	restitutionExtraHorizontal?: number;
	restitutionExtraVertical?: number;
	restitutionTime?: number;
	restitutionEasing?: (k: number) => number;
	disableDragControls?: boolean;

	bleedOut?: boolean;
}
