import { Texture } from "@pixi/core";
import { NineSlicePlane } from "@pixi/mesh-extras";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import i18next from "i18next";
import { SimpleButton } from "../../../engine/ui/button/SimpleButton";
import { Manager } from "../../..";
import { DemoPopup } from "./DemoPopup";
import { Keyboard } from "../../../engine/input/Keyboard";

export class UIScene extends PixiScene {
	public static readonly BUNDLES = ["img"];

	private nineSlicePanel: NineSlicePlane;
	private nineSliceTitle: Text;
	private nineSliceBody: Text;
	private btnOpenPopup: SimpleButton;
	constructor() {
		super();

		const auxTextstyle = new TextStyle({
			fill: "white",
			fontFamily: "Arial Rounded MT",
			stroke: "black",
			strokeThickness: 5,
			lineJoin: "round",
			fontSize: 18,
		});

		// #region NineSlicePlane
		this.nineSlicePanel = new NineSlicePlane(Texture.from("ui-placeholder-demo/9slice.png"), 35, 35, 35, 35);
		this.addChild(this.nineSlicePanel);
		this.nineSlicePanel.width = 600; // Will be overriten by the resize method!
		this.nineSlicePanel.height = 600; // Will be overriten by the resize method!
		this.nineSlicePanel.position.set(100, 100);
		// #endregion

		// #region Explanation
		const titleStyle = auxTextstyle.clone();
		this.nineSliceTitle = new Text(i18next.t("demos.ui.nineslice.title"), titleStyle);
		this.nineSliceTitle.position.set(10, 0);
		this.nineSliceTitle.anchor.set(0, 0.5);
		this.nineSliceTitle.y = 14;
		this.nineSlicePanel.addChild(this.nineSliceTitle);

		const multilineStyle = auxTextstyle.clone();
		multilineStyle.wordWrap = true;
		multilineStyle.wordWrapWidth = 600; // Will be overriten by the resize method!
		multilineStyle.fontSize = 22;
		this.nineSliceBody = new Text(i18next.t("demos.ui.nineslice.body"), multilineStyle);
		this.nineSliceBody.position.set(10, 35);
		this.nineSlicePanel.addChild(this.nineSliceBody);
		// #endregion

		// #region Open popup simple button
		this.btnOpenPopup = new SimpleButton("ui-placeholder-demo/btnPlay.png", () => this.openPopup());
		this.btnOpenPopup.x = this.nineSlicePanel.width / 2; // Will be overriten by the resize method!
		this.btnOpenPopup.y = this.nineSliceBody.y + this.nineSliceBody.height + this.btnOpenPopup.height * 0.5; // Will be overriten by the resize method!
		this.nineSlicePanel.addChild(this.btnOpenPopup);
		// #endregion
	}
	private openPopup(): void {
		// Manager.openPopup is the way of opening a scene as a popup.
		Manager.openPopup(DemoPopup);

		Keyboard.shared.pressed.once("Escape", () => {
			Manager.requestCloseAllPopups(); // Example on how to ask nicely for all popups to die.
			// Manager.requestCloseAllPopups({ timeout: 750 }); // You can specify a maximum time to wait for the popup to close.
		});
	}

	public override onResize(newW: number, newH: number): void {
		// #region NineSlicePlane
		this.nineSlicePanel.position.set(100, 100);
		this.nineSlicePanel.width = newW - 100 - 20;
		this.nineSlicePanel.height = newH - 100 - 20;
		// #endregion

		// #region Explanation
		// Make font smaller while it doesn't fit
		this.nineSliceTitle.style.fontSize = 18;
		while (this.nineSliceTitle.width > this.nineSlicePanel.width - 20 && this.nineSliceTitle.style.fontSize > 1) {
			this.nineSliceTitle.style.fontSize--;
		}

		// Make text wrap to the new width.
		this.nineSliceBody.style.wordWrapWidth = this.nineSlicePanel.width - 20;
		// #endregion

		// #region Open popup simple button
		// Place button below the text
		this.btnOpenPopup.x = this.nineSlicePanel.width / 2;
		this.btnOpenPopup.y = this.nineSliceBody.y + this.nineSliceBody.height + this.btnOpenPopup.height * 0.5;
		// #endregion
	}
}
