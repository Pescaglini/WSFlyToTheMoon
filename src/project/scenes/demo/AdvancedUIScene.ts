import { Texture } from "@pixi/core";
import { NineSlicePlane } from "@pixi/mesh-extras";
import { Text, TextStyle } from "@pixi/text";
import i18next from "i18next";
import { StackPanel } from "../../../engine/ui/grid/StackPanel";
import { ToggleSwitch } from "../../../engine/ui/toggle/ToggleSwitch";
import { ToggleCheck } from "../../../engine/ui/toggle/ToggleCheck";
import { ScrollView } from "../../../engine/ui/scrollview/ScrollView";
import { Rectangle } from "@pixi/core";
import { Easing } from "tweedle.js";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";

export class AdvancedUIScene extends PixiScene {
	public static BUNDLES = ["img"];
	private nineSlicePanel: NineSlicePlane;
	private nineSliceTitle: Text;

	private mainStack: StackPanel;
	private scrollView: ScrollView;

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

		const titleStyle = auxTextstyle.clone();
		this.nineSliceTitle = new Text(i18next.t("demos.ui.nineslice.title"), titleStyle);
		this.nineSliceTitle.position.set(10, 0);
		this.nineSliceTitle.anchor.set(0, 0.5);
		this.nineSliceTitle.y = 14;
		this.nineSlicePanel.addChild(this.nineSliceTitle);

		const multilineStyle = auxTextstyle.clone();
		multilineStyle.wordWrap = true;
		multilineStyle.wordWrapWidth = 700; // Will be overriten by the resize method!
		multilineStyle.fontSize = 22;
		const nineSliceBodyText = new Text(i18next.t("demos.ui.nineslice.body"), multilineStyle);

		const toggleSwitch = new ToggleSwitch({
			knobTexture: "ui-placeholder-demo/toggleKnob.png",
			backgroundTexture: "ui-placeholder-demo/toggleBackground.png",
			travelDistance: Texture.from("ui-placeholder-demo/toggleBackground.png").width,
			tweenDuration: 500,
		});

		const checkbox = new ToggleCheck({
			buttonTexture: "ui-placeholder-demo/markBG.png",
			checkTexture: "ui-placeholder-demo/mark.png",
		});

		const lorem = new Text(
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus quis tincidunt elit. Duis a rhoncus mauris, in posuere ante. Mauris massa mauris, dignissim vel massa non, egestas lacinia justo. Integer a pharetra dolor. Etiam consequat tincidunt leo vel dapibus. Ut lacinia mollis lectus, in consequat tortor hendrerit vel. Sed sed ante vel ipsum convallis ultrices non id libero. Donec ultricies tempor dui id rutrum. Mauris consequat lacus elit, ac mollis arcu dignissim venenatis.",
			multilineStyle
		);

		//
		this.mainStack = new StackPanel({ orientation: "vertical" });
		this.mainStack.elements.push(nineSliceBodyText, toggleSwitch, checkbox, lorem); // to add elements to a stack you push them to the elements array!
		this.mainStack.refreshLayout(); // Call this after adding all elements to the stack!

		this.scrollView = new ScrollView("disabled", 600, {
			addToContent: [this.mainStack],
			scrollLimits: new Rectangle(0, 0, this.mainStack.width, this.mainStack.height),
			restitutionExtraVertical: 50,
			restitutionTime: 150,
			restitutionEasing: Easing.Quadratic.Out,
		});
		this.scrollView.position.set(10, 35);

		this.nineSlicePanel.addChild(this.scrollView);
	}

	public override onResize(newW: number, newH: number): void {
		// #region NineSlicePlane
		this.nineSlicePanel.position.set(100, 100);
		this.nineSlicePanel.width = newW - 100 - 20;
		this.nineSlicePanel.height = newH - 100 - 20;
		// #endregion

		// Make font smaller while it doesn't fit
		this.nineSliceTitle.style.fontSize = 18;
		while (this.nineSliceTitle.width > this.nineSlicePanel.width - 20 && this.nineSliceTitle.style.fontSize > 1) {
			this.nineSliceTitle.style.fontSize--;
		}

		this.scrollView.width = this.nineSlicePanel.width - 20;
		this.scrollView.scale.y = this.scrollView.scale.x;
		this.scrollView.scrollHeight = (this.nineSlicePanel.height - 20) / this.scrollView.scale.y;
	}
}
