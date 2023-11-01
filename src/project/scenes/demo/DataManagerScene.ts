import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { DataManager } from "../../../engine/datamanager/DataManager";

export class DataManagerScene extends PixiScene {
	public static readonly BUNDLES = [""];
	private appleCount: number = 0;

	private currentApplesText: Text;
	private savedApplesText: Text;
	constructor() {
		super();

		this.makeDemoText();
		this.refreshText();
	}

	private saveApples(): void {
		// To save, first set the values in the object. This is not expensive
		DataManager.setValue("apples", this.appleCount);

		// After you set all the values you want to store, save the object!
		DataManager.save();
	}
	private loadApples(): void {
		// Load is automagically caled at the beggining of the app, you probably don't need to use it
		DataManager.load();

		// Read a variable with `getValue`. Be careful, it will return undefined if the variable was never saved before.
		const apples = DataManager.getValue<number>("apples");
		if (apples != undefined) {
			this.appleCount = apples;
		} else {
			this.appleCount = 0;
		}
	}

	private deleteApples(): void {
		// ! This will delete all saved values!
		DataManager.delete();
	}

	private refreshText(): void {
		this.currentApplesText.text = i18next.t("demos.datamanager.currentCount", { count: this.appleCount });

		const savedApples = DataManager.getValue<number>("apples");
		if (savedApples != undefined) {
			this.savedApplesText.text = i18next.t("demos.datamanager.savedCount", { count: savedApples });
		} else {
			this.savedApplesText.text = i18next.t("demos.datamanager.noSavedCount");
		}
	}

	/**
	 * Method to make the text explaining the demo. Nothing to see here.
	 */
	private makeDemoText(): void {
		const textStyle = new TextStyle({
			fill: "white",
			fontFamily: "Arial Rounded MT",
			stroke: "black",
			strokeThickness: 10,
			lineJoin: "round",
		});

		const instructions = new Text(i18next.t("demos.datamanager.instructions"), textStyle);
		instructions.x = 100;
		this.addChild(instructions);

		this.currentApplesText = new Text("", textStyle);
		this.currentApplesText.x = instructions.x;
		this.currentApplesText.y = instructions.y + instructions.height + 20;
		this.addChild(this.currentApplesText);

		this.savedApplesText = new Text("", textStyle);
		this.savedApplesText.x = instructions.x;
		this.savedApplesText.y = this.currentApplesText.y + this.currentApplesText.height + 20;
		this.addChild(this.savedApplesText);

		const addApple = new Text("+", textStyle);
		addApple.y = instructions.y + instructions.height + 20;
		addApple.interactive = true;
		addApple.on("pointerdown", () => {
			this.appleCount++;
			this.refreshText();
		});
		this.addChild(addApple);

		const removeApple = new Text("-", textStyle);
		removeApple.x = addApple.width + 20;
		removeApple.y = instructions.y + instructions.height + 20;
		removeApple.interactive = true;
		removeApple.on("pointerdown", () => {
			this.appleCount--;
			this.appleCount = Math.max(this.appleCount, 0);
			this.refreshText();
		});
		this.addChild(removeApple);

		const saveApples = new Text(i18next.t("demos.datamanager.save"), textStyle);
		saveApples.x = instructions.x;
		saveApples.y = this.savedApplesText.y + this.savedApplesText.height + 20;

		saveApples.interactive = true;
		saveApples.on("pointerdown", () => {
			this.saveApples();
			this.refreshText();
		});
		this.addChild(saveApples);

		const loadApples = new Text(i18next.t("demos.datamanager.load"), textStyle);
		loadApples.x = saveApples.x + saveApples.width + 20;
		loadApples.y = this.savedApplesText.y + this.savedApplesText.height + 20;

		loadApples.interactive = true;
		loadApples.on("pointerdown", () => {
			this.loadApples();
			this.refreshText();
		});
		this.addChild(loadApples);

		const nukeApples = new Text(i18next.t("demos.datamanager.nuke"), textStyle);
		nukeApples.x = loadApples.x + loadApples.width + 20;
		nukeApples.y = this.savedApplesText.y + this.savedApplesText.height + 20;

		nukeApples.interactive = true;
		nukeApples.on("pointerdown", () => {
			this.deleteApples();
			this.refreshText();
		});
		this.addChild(nukeApples);
	}
}
