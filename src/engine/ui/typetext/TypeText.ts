// Ideally backend is a parameter or a template or something. This idea proved a bit too hard for the needs of this

import { Container } from "@pixi/display";
import { TextStyle, Text, TextMetrics } from "@pixi/text";

type TextLike = { text: string } & Container;
export class TypeText extends Container {
	private backend: TextLike;

	public linesToShow: number;
	private measurements: TextMetrics;

	private currentLine: number = 0;
	private currentChar: number = 0;

	private metricsStyle: TextStyle;
	constructor(linesToShow: number = 3, width: number = 500, style: any = {}, backend: new (...args: any[]) => TextLike = Text) {
		super();
		this.metricsStyle = new TextStyle({ wordWrap: true, wordWrapWidth: width });
		this.linesToShow = linesToShow;
		this.backend = new backend("", style);
		this.addChild(this.backend);
	}

	public loadText(longText: string): void {
		this.measurements = TextMetrics.measureText(longText, this.metricsStyle);
		this.currentLine = this.currentChar = 0;
		console.log(this.measurements);
	}

	private updateText(): string {
		let retval = "";
		const firstLine = this.currentLine - (this.currentLine % this.linesToShow);
		for (let i = firstLine; i < this.currentLine; i++) {
			retval += `${this.measurements.lines[i]}\n`;
		}
		retval += this.measurements.lines[this.currentLine].substr(0, this.currentChar);
		return retval;
	}

	public advanceChar(): string {
		// if I am on the last line of this block and on the last character of said last line, we can't add char.
		const isLastCharOfLine: boolean = this.measurements.lines[this.currentLine].length < this.currentChar;
		if (isLastCharOfLine) {
			return null;
		}

		// advance anyways
		this.currentChar++;

		// write the new text
		this.updateText();

		this.backend.text = this.updateText();

		return this.backend.text.substr(-1, 1);
	}

	public advanceLine(): boolean {
		const isLastLineOfBlock: boolean = (this.currentLine + 1) % this.linesToShow == 0;
		const isLastLineOfAllText: boolean = this.currentLine >= this.measurements.lines.length - 1;
		if (isLastLineOfBlock || isLastLineOfAllText) {
			this.currentChar = this.measurements.lines[this.currentLine].length;
			return false;
		}
		this.currentChar = 0;
		this.currentLine++;
		this.backend.text = this.updateText();
		return true;
	}

	public advanceBlock(): boolean {
		const isLastLineOfAllText: boolean = this.currentLine >= this.measurements.lines.length - 1;
		if (isLastLineOfAllText) {
			this.currentLine == this.measurements.lines.length - 1;
			return false;
		}
		this.currentLine += this.linesToShow - (this.currentLine % this.linesToShow);
		this.currentChar = 0;
		if (this.currentLine >= this.measurements.lines.length) {
			this.currentLine == this.measurements.lines.length - 1;
			this.currentChar = this.measurements.lines[this.currentLine].length;
			return false;
		}
		return true;
	}
}
