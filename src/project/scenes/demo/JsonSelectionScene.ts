import { Graphics } from "@pixi/graphics";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { GraphicsHelper } from "../../../engine/utils/GraphicsHelper";
import { Container } from "@pixi/display";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import { BitmapText } from "@pixi/text-bitmap";
import { loadJSON } from "../../../engine/utils/browserFunctions";

export class JSONSelector extends PixiScene {
	public static readonly BUNDLES = [""];
	private background: Graphics;
	private mainContainer: Container;

	private changeCheck: Graphics;
	private loadButton: Graphics;
	private continueButton: Graphics;
	constructor() {
		super();
		this.background = GraphicsHelper.pixel(0x8b8b8b);
		this.addChild(this.background);

		this.mainContainer = new Container();
		this.addChild(this.mainContainer);

		this.changeCheck = new Graphics().beginFill(0xffffff).drawRect(-40, -40, 80, 80).endFill();
		this.changeCheck.tint = 0x8b8b8b;

		this.loadButton = new Graphics().beginFill(0x777777).drawRect(-280, -60, 560, 120).endFill();
		this.mainContainer.addChild(this.loadButton);

		this.loadButton.eventMode = "static";
		this.loadButton.cursor = "pointer";
		this.loadButton.y -= 100;
		this.loadButton.on("pointertap", this.selectJSON.bind(this));
		const loadText = new BitmapText("LOAD CUSTOM JSON", { fontName: "ArialRoundedMTBold", fontSize: 30, tint: 0xeeeeee, align: "center" });
		loadText.anchor.set(0.5);
		loadText.x -= 40;
		this.loadButton.addChild(loadText, this.changeCheck);
		this.changeCheck.x = this.loadButton.width * 0.4;

		this.continueButton = new Graphics().beginFill(0x777777).drawRect(-280, -60, 560, 120).endFill();
		this.mainContainer.addChild(this.continueButton);

		this.continueButton.eventMode = "static";
		this.continueButton.cursor = "pointer";
		this.continueButton.y += 100;
		this.continueButton.on("pointertap", this.changeScene.bind(this));

		const continueText = new BitmapText("CONTINUE", { fontName: "ArialRoundedMTBold", fontSize: 40, tint: 0xeeeeee, align: "center" });
		continueText.anchor.set(0.5);
		this.continueButton.addChild(continueText);
	}

	private async selectJSON(): Promise<void> {
		try {
			const loadedJson = JSON.parse(await loadJSON());
			console.log(JSON.stringify(loadedJson, null, 2));

			this.changeCheck.tint = 0x00ff00;
		} catch (_) {
			alert("This file isn't valid.");
		}
	}

	private changeScene(): void {
		console.warn("There's no scene change");
		// Manager.changeScene()
	}

	public override onResize(_newW: number, _newH: number): void {
		this.background.width = _newW;
		this.background.height = _newH;

		ScaleHelper.setScaleRelativeToScreen(this.mainContainer, _newW, _newH, 0.8, 0.6);
		this.mainContainer.position.set(_newW / 2, _newH / 2);
	}
}
