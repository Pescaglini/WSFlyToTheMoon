import type { Renderer } from "@pixi/core";
import { Container } from "@pixi/display";
import { Graphics } from "@pixi/graphics";
import { Dictionary } from "../dictionary/Dictionary";
import type { TextStyleAlign } from "@pixi/text";
import { Text, TextStyle, TextMetrics } from "@pixi/text";
import { Key } from "../input/Key";
import type { Matrix } from "@pixi/core";

// This class is now nicer... yay!
/**
 * Example 		
	const input = new TextInput({
		input: {
			fontSize: "18pt",
			padding: "10px",
			width: "260px",
			height: "300px",
			color: "#26272E",
			fontFamily: "Fredoka One",
			textAlign: "center",
		},
		box: {
			default: { fill: 0xe8e9f3, rounded: 16, stroke: { color: 0xcbcee0, width: 4 } },
			focused: { fill: 0xe1e3ee, rounded: 16, stroke: { color: 0xabafc6, width: 4 } },
			disabled: { fill: 0xdbdbdb, rounded: 16 },
		},
	});
	input.type = "tel";
 */
export class TextInput extends Container {
	private inputStyle: Partial<CSSStyleDeclaration>;
	private boxGenerator: (w: number, h: number, state: any) => Graphics;
	private multiline: boolean;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private boxCache: Dictionary<Graphics>;
	private previous: any; // Kinda Partial<TextInput>
	private domAdded: boolean;
	private _domVisible: boolean;
	private _placeholder: string;
	private placeholderColor: number;
	private selection: number[];
	private restrictValue: string;
	private substituted: boolean;
	private domInput: HTMLTextAreaElement | HTMLInputElement;
	private _disabled: boolean;
	private _maxLength: number;
	private restrictRegex: RegExp;
	public domVisible: boolean;
	private lastRenderer: Renderer;
	public state: "DEFAULT" | "FOCUSED" | "DISABLED";
	private resolution: number;
	private canvasBounds: {
		top: number;
		left: number;
		width: number;
		height: number;
	};
	private box: Graphics;
	private surrogate: Text;
	private surrogateHitbox: Graphics;
	private surrogateMask: Graphics;
	public fontMetrics: any; // IFontMetrics not exported?
	public blurOnReturn: boolean = true;
	constructor(styles: { input: Partial<CSSStyleDeclaration>; box: any }) {
		super();
		this.inputStyle = Object.assign(
			{
				position: "absolute",
				background: "none",
				border: "none",
				outline: "none",
				transformOrigin: "0 0",
				lineHeight: "1",
			},
			styles.input
		);

		if (styles.box) {
			this.boxGenerator = typeof styles.box === "function" ? styles.box : defaultBoxGenerator(styles.box);
		} else {
			this.boxGenerator = null;
		}

		if (this.inputStyle.hasOwnProperty("wordWrap")) {
			this.multiline = Boolean(this.inputStyle.wordWrap);
			delete this.inputStyle.wordWrap;
		} else {
			this.multiline = false;
		}

		this.boxCache = new Dictionary();
		this.previous = {};
		this.domAdded = false;
		this._domVisible = true;
		this._placeholder = "";
		this.placeholderColor = 0xa9a9a9;
		this.selection = [0, 0];
		this.restrictValue = "";
		this._createDOMInput();
		this.substituteText = true;
		this._setState("DEFAULT");
		this._addListeners();
	}

	// GETTERS & SETTERS

	public get type(): "color" | "date" | "datetime-local" | "email" | "month" | "number" | "password" | "search" | "tel" | "time" | "url" | "text" | "week" | "textarea" {
		return this.domInput.type as any;
	}

	public set type(text) {
		if (this.domInput instanceof HTMLInputElement) {
			this.domInput.type = text;
		}
	}

	public get substituteText(): boolean {
		return this.substituted;
	}

	public set substituteText(substitute) {
		if (this.substituted == substitute) {
			return;
		}

		this.substituted = substitute;

		if (substitute) {
			this._createSurrogate();
			this._domVisible = false;
		} else {
			this._destroySurrogate();
			this._domVisible = true;
		}
		this.placeholder = this._placeholder;
		this._update();
	}

	public get placeholder(): string {
		return this._placeholder;
	}

	public set placeholder(text) {
		this._placeholder = text;
		if (this.substituted) {
			this._updateSurrogate();
			this.domInput.placeholder = "";
		} else {
			this.domInput.placeholder = text;
		}
	}

	public get disabled(): boolean {
		return this._disabled;
	}

	public set disabled(disabled) {
		this._disabled = disabled;
		this.domInput.disabled = disabled;
		this._setState(disabled ? "DISABLED" : "DEFAULT");
	}

	public get maxLength(): number {
		return this._maxLength;
	}

	public set maxLength(length) {
		this._maxLength = length;
		this.domInput.setAttribute("maxlength", length.toString());
	}

	public get restrict(): RegExp {
		return this.restrictRegex;
	}

	public set restrict(regex: RegExp | string) {
		if (regex instanceof RegExp) {
			regex = regex.toString().slice(1, -1);

			if (regex.charAt(0) !== "^") {
				regex = `^${regex}`;
			}

			if (regex.charAt(regex.length - 1) !== "$") {
				regex = `${regex}$`;
			}

			regex = new RegExp(regex);
		} else {
			regex = new RegExp(`^[${regex}]*$`);
		}

		this.restrictRegex = regex;
	}

	public get text(): string {
		return this.domInput.value;
	}

	public set text(text) {
		this.domInput.value = text;
		if (this.substituted) {
			this._updateSurrogate();
		}
	}

	public get htmlInput(): HTMLTextAreaElement | HTMLInputElement {
		return this.domInput;
	}

	public focus(): void {
		if (this.substituted && !this.domVisible) {
			this._setDOMInputVisible(true);
		}

		this.domInput.focus();
	}

	public blur(): void {
		this.domInput.blur();
		this.domInput.inputMode = "none";
		this.domInput.inputMode = undefined;
	}

	public select(): void {
		this.focus();
		this.domInput.select();
	}

	public setInputStyle(key: WritableKeysOf<CSSStyleDeclaration>, value: any): void {
		this.inputStyle[key] = value;
		this.domInput.style[key] = value;

		if (this.substituted && (key === "fontFamily" || key === "fontSize")) {
			this._updateFontMetrics();
		}

		if (this.lastRenderer) {
			this._update();
		}
	}

	public override destroy(options?: any): void {
		this._destroyBoxCache();
		super.destroy(options);
	}

	// SETUP

	private _createDOMInput(): void {
		if (this.multiline) {
			this.domInput = document.createElement("textarea");
			this.domInput.style.resize = "none";
		} else {
			this.domInput = document.createElement("input");
			this.domInput.type = "text";
		}

		for (const key in this.inputStyle) {
			this.domInput.style[key] = this.inputStyle[key];
		}

		console.log(this.domInput);
	}

	private _addListeners(): void {
		this.on("added", this._onAdded.bind(this));
		this.on("removed", this._onRemoved.bind(this));
		this.domInput.addEventListener("keydown", this._onInputKeyDown.bind(this));
		this.domInput.addEventListener("input", this._onInputInput.bind(this));
		this.domInput.addEventListener("keyup", this._onInputKeyUp.bind(this));
		this.domInput.addEventListener("focus", this._onFocused.bind(this));
		this.domInput.addEventListener("blur", this._onBlurred.bind(this));
	}

	private _onInputKeyDown(e: KeyboardEvent): void {
		this.selection = [this.domInput.selectionStart, this.domInput.selectionEnd];

		// Mobile doesn't implement `code`
		const returnPressed = e.code == Key.ENTER || e.code == Key.NUMPAD_ENTER || e.key == "Enter";
		if (this.blurOnReturn && returnPressed && this.domInput instanceof HTMLInputElement) {
			this.blur();
		}

		// this.emit("keydown", e.key);
	}

	private _onInputInput(): void {
		if (this.restrictRegex) {
			this._applyRestriction();
		}

		if (this.substituted) {
			this._updateSubstitution();
		}
		// this.emit("input", this.text);
	}

	private _onInputKeyUp(_e: KeyboardEvent): void {
		// this.emit("keyup", e.key);
	}

	private _onFocused(): void {
		this._setState("FOCUSED");
		// this.emit("focus");
	}

	private _onBlurred(): void {
		this._setState("DEFAULT");
		// this.emit("blur");
	}

	private _onAdded(): void {
		document.body.appendChild(this.domInput);
		this.domInput.style.display = "none";
		this.domAdded = true;
	}

	private _onRemoved(): void {
		document.body.removeChild(this.domInput);
		this.domAdded = false;
	}

	private _setState(state: any): void {
		this.state = state;
		this._updateBox();
		if (this.substituted) {
			this._updateSubstitution();
		}
	}

	// RENDER & UPDATE

	// for pixi v5
	public override render(renderer: Renderer): void {
		super.render(renderer);
		this._renderInternal(renderer);
	}

	private _renderInternal(renderer: Renderer): void {
		this.resolution = renderer.resolution;
		this.lastRenderer = renderer;
		this.canvasBounds = this._getCanvasBounds();
		if (this._needsUpdate()) {
			this._update();
		}
	}

	private _update(): void {
		this._updateDOMInput();
		if (this.substituted) {
			this._updateSurrogate();
		}
		this._updateBox();
	}

	private _updateBox(): void {
		if (!this.boxGenerator) {
			return;
		}

		if (this._needsNewBoxCache()) {
			this._buildBoxCache();
		}

		if (this.state == this.previous.state && this.box == this.boxCache[this.state]) {
			return;
		}

		if (this.box) {
			this.removeChild(this.box);
		}

		this.box = this.boxCache[this.state];
		this.addChildAt(this.box, 0);
		this.previous.state = this.state;
	}

	private _updateSubstitution(): void {
		if (this.state === "FOCUSED") {
			this._domVisible = true;
			this.surrogate.visible = this.text.length === 0;
		} else {
			this._domVisible = false;
			this.surrogate.visible = true;
		}
		this._updateDOMInput();
		this._updateSurrogate();
	}

	private _updateDOMInput(): void {
		if (!this.canvasBounds) {
			return;
		}

		this.domInput.style.top = `${this.canvasBounds.top || 0}px`;
		this.domInput.style.left = `${this.canvasBounds.left || 0}px`;
		this.domInput.style.transform = this._pixiMatrixToCSS(this._getDOMRelativeWorldTransform());
		this.domInput.style.opacity = this.worldAlpha.toString();
		this._setDOMInputVisible(this.worldVisible && this._domVisible);

		this.previous.canvas_bounds = this.canvasBounds;
		this.previous.world_transform = this.worldTransform.clone();
		this.previous.world_alpha = this.worldAlpha;
		this.previous.world_visible = this.worldVisible;
	}

	private _applyRestriction(): void {
		if (this.restrictRegex.test(this.text)) {
			this.restrictValue = this.text;
		} else {
			this.text = this.restrictValue;
			this.domInput.setSelectionRange(this.selection[0], this.selection[1]);
		}
	}

	// STATE COMPAIRSON (FOR PERFORMANCE BENEFITS)

	private _needsUpdate(): boolean {
		return (
			!this._comparePixiMatrices(this.worldTransform, this.previous.world_transform) ||
			!this._compareClientRects(this.canvasBounds, this.previous.canvas_bounds) ||
			this.worldAlpha != this.previous.world_alpha ||
			this.worldVisible != this.previous.world_visible
		);
	}

	private _needsNewBoxCache(): boolean {
		const inputBounds = this._getDOMInputBounds();
		return !this.previous.input_bounds || inputBounds.width != this.previous.input_bounds.width || inputBounds.height != this.previous.input_bounds.height;
	}

	// INPUT SUBSTITUTION

	private _createSurrogate(): void {
		this.surrogateHitbox = new Graphics();
		this.surrogateHitbox.alpha = 0;
		this.surrogateHitbox.interactive = true;
		this.surrogateHitbox.cursor = "text";
		this.surrogateHitbox.on("pointerdown", this._onSurrogateFocus.bind(this));
		this.addChild(this.surrogateHitbox);

		this.surrogateMask = new Graphics();
		this.addChild(this.surrogateMask);

		this.surrogate = new Text("", {});
		this.addChild(this.surrogate);

		this.surrogate.mask = this.surrogateMask;

		this._updateFontMetrics();
		this._updateSurrogate();
	}

	private _updateSurrogate(): void {
		const padding = this._deriveSurrogatePadding();
		const inputBounds = this._getDOMInputBounds();

		this.surrogate.style = this._deriveSurrogateStyle();
		this.surrogate.style.padding = Math.max(...padding);
		this.surrogate.y = this.multiline ? padding[0] : (inputBounds.height - this.surrogate.height) / 2;
		this.surrogate.x = padding[3];
		this.surrogate.text = this._deriveSurrogateText();

		switch (this.surrogate.style.align) {
			case "left":
				this.surrogate.x = padding[3];
				break;

			case "center":
				this.surrogate.x = inputBounds.width * 0.5 - this.surrogate.width * 0.5;
				break;

			case "right":
				this.surrogate.x = inputBounds.width - padding[1] - this.surrogate.width;
				break;
		}

		this._updateSurrogateHitbox(inputBounds);
		this._updateSurrogateMask(inputBounds, padding);
	}

	private _updateSurrogateHitbox(bounds: any): void {
		this.surrogateHitbox.clear();
		this.surrogateHitbox.beginFill(0);
		this.surrogateHitbox.drawRect(0, 0, bounds.width, bounds.height);
		this.surrogateHitbox.endFill();
		this.surrogateHitbox.interactive = !this._disabled;
	}

	private _updateSurrogateMask(bounds: any, padding: any): void {
		this.surrogateMask.clear();
		this.surrogateMask.beginFill(0);
		this.surrogateMask.drawRect(padding[3], 0, bounds.width - padding[3] - padding[1], bounds.height);
		this.surrogateMask.endFill();
	}

	private _destroySurrogate(): void {
		if (!this.surrogate) {
			return;
		}

		this.removeChild(this.surrogate);
		this.removeChild(this.surrogateHitbox);

		this.surrogate.destroy();
		this.surrogateHitbox.destroy();

		this.surrogate = null;
		this.surrogateHitbox = null;
	}

	private _onSurrogateFocus(): void {
		this._setDOMInputVisible(true);
		// sometimes the input is not being focused by the mouseclick
		this._ensureFocus();
		setTimeout(this._ensureFocus.bind(this), 10);
	}

	private _ensureFocus(): void {
		if (!this._hasFocus()) {
			this.focus();
		}
	}

	private _deriveSurrogateStyle(): TextStyle {
		const style = new TextStyle();

		for (const key in this.inputStyle) {
			switch (key) {
				case "color":
					style.fill = this.inputStyle.color;
					break;

				case "fontFamily":
				case "fontSize":
				case "fontWeight":
				case "fontVariant":
				case "fontStyle":
					(style as any)[key] = this.inputStyle[key] as any;
					break;

				case "letterSpacing":
					style.letterSpacing = parseFloat(this.inputStyle.letterSpacing);
					break;

				case "textAlign":
					style.align = this.inputStyle.textAlign as TextStyleAlign;
					break;
			}
		}

		if (this.multiline) {
			style.lineHeight = parseFloat(style.fontSize as any);
			style.wordWrap = true;
			style.wordWrapWidth = this._getDOMInputBounds().width;
		}

		if (this.domInput.value.length === 0) {
			style.fill = this.placeholderColor;
		}

		return style;
	}

	private _deriveSurrogatePadding(): number[] {
		const indent = this.inputStyle.textIndent ? parseFloat(this.inputStyle.textIndent) : 0;

		if (this.inputStyle.padding && this.inputStyle.padding.length > 0) {
			const components = this.inputStyle.padding.trim().split(" ");

			if (components.length == 1) {
				const padding = parseFloat(components[0]);
				return [padding, padding, padding, padding + indent];
			} else if (components.length == 2) {
				const paddingV = parseFloat(components[0]);
				const paddingH = parseFloat(components[1]);
				return [paddingV, paddingH, paddingV, paddingH + indent];
			} else if (components.length == 4) {
				const padding = components.map((component: any) => {
					return parseFloat(component);
				});
				padding[3] += indent;
				return padding;
			}
		}

		return [0, 0, 0, indent];
	}

	private _deriveSurrogateText(): string {
		if (this.domInput.value.length === 0) {
			return this._placeholder;
		} else {
			switch (this.type) {
				case "password":
					return "•".repeat(this.domInput.value.length);

				default:
					return this.domInput.value;
			}
		}
	}

	private _updateFontMetrics(): void {
		const style = this._deriveSurrogateStyle();
		const font = style.toFontString();

		this.fontMetrics = TextMetrics.measureFont(font);
	}

	// CACHING OF INPUT BOX GRAPHICS

	private _buildBoxCache(): void {
		this._destroyBoxCache();

		const states = ["DEFAULT", "FOCUSED", "DISABLED"];
		const inputBounds = this._getDOMInputBounds();

		for (const state of states) {
			this.boxCache[state] = this.boxGenerator(inputBounds.width, inputBounds.height, state);
		}

		this.previous.input_bounds = inputBounds;
	}

	private _destroyBoxCache(): void {
		if (this.box) {
			this.removeChild(this.box);
			this.box = null;
		}

		for (const i in this.boxCache) {
			this.boxCache[i].destroy();
			this.boxCache[i] = null;
			delete this.boxCache[i];
		}
	}

	// HELPER FUNCTIONS

	private _hasFocus(): boolean {
		return document.activeElement === this.domInput;
	}

	private _setDOMInputVisible(visible: any): void {
		this.domInput.style.display = visible ? "block" : "none";
	}

	private _getCanvasBounds(): {
		top: number;
		left: number;
		width: number;
		height: number;
	} {
		const rect = this.lastRenderer.view.getBoundingClientRect();
		const bounds = {
			top: rect.y,
			left: rect.x,
			width: rect.width,
			height: rect.height,
		};
		bounds.left += window.scrollX;
		bounds.top += window.scrollY;
		return bounds;
	}

	private _getDOMInputBounds(): DOMRect {
		let removeAfter = false;

		if (!this.domAdded) {
			document.body.appendChild(this.domInput);
			removeAfter = true;
		}

		const orgTransform = this.domInput.style.transform;
		const orgDisplay = this.domInput.style.display;
		this.domInput.style.transform = "";
		this.domInput.style.display = "block";
		const bounds = this.domInput.getBoundingClientRect();
		this.domInput.style.transform = orgTransform;
		this.domInput.style.display = orgDisplay;

		if (removeAfter) {
			document.body.removeChild(this.domInput);
		}

		return bounds;
	}

	private _getDOMRelativeWorldTransform(): Matrix {
		const canvasBounds = this.lastRenderer.view.getBoundingClientRect();
		const matrix = this.worldTransform.clone();

		matrix.scale(this.resolution, this.resolution);
		matrix.scale(canvasBounds.width / this.lastRenderer.width, canvasBounds.height / this.lastRenderer.height);
		return matrix;
	}

	private _pixiMatrixToCSS(m: any): string {
		return `matrix(${[m.a, m.b, m.c, m.d, m.tx, m.ty].join(",")})`;
	}

	private _comparePixiMatrices(m1: any, m2: any): boolean {
		if (!m1 || !m2) {
			return false;
		}
		return m1.a == m2.a && m1.b == m2.b && m1.c == m2.c && m1.d == m2.d && m1.tx == m2.tx && m1.ty == m2.ty;
	}

	private _compareClientRects(r1: any, r2: any): boolean {
		if (!r1 || !r2) {
			return false;
		}
		return r1.left == r2.left && r1.top == r2.top && r1.width == r2.width && r1.height == r2.height;
	}
}

function defaultBoxGenerator(styles: any): (w: number, h: number, state: any) => Graphics {
	styles = styles || { fill: 0xcccccc };

	if (styles.default) {
		styles.focused = styles.focused || styles.default;
		styles.disabled = styles.disabled || styles.default;
	} else {
		const tempStyles = styles;
		styles = {};
		styles.default = styles.focused = styles.disabled = tempStyles;
	}

	return function (w: number, h: number, state: any): Graphics {
		const style = styles[state.toLowerCase()];
		const box = new Graphics();

		if (style.fill) {
			box.beginFill(style.fill);
		}

		if (style.stroke) {
			box.lineStyle(style.stroke.width || 1, style.stroke.color || 0, style.stroke.alpha || 1);
		}

		if (style.rounded) {
			box.drawRoundedRect(0, 0, w, h, style.rounded);
		} else {
			box.drawRect(0, 0, w, h);
		}

		box.endFill();
		box.closePath();

		return box;
	};
}

type WritableKeysOf<T> = {
	[P in keyof T]: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P, never>;
}[keyof T];

type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;
