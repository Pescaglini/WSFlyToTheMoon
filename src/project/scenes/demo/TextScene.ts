import i18next from "i18next";
import { PixiScene } from "src/engine/scenemanager/scenes/PixiScene";
import { Text, TextStyle } from "@pixi/text";
import { BitmapFont, BitmapText } from "@pixi/text-bitmap";
import { Container } from "@pixi/display";
import { Tween } from "tweedle.js";
import { MTSDFSprite } from "../../../engine/mtsdfSprite/MTSDFSprite";
import { Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";

export class TextScene extends PixiScene {
	public static readonly BUNDLES = ["mtsdf"];

	constructor() {
		super();

		/**
		 * Text example. This is overly verbose for explanation purposes. Feel free to write more consise code.
		 * Text is the most flexible in term of styling changing the text is expensive
		 * This requires a webfont. Ask Milton how to get one. (Transfonter on a TTF file)
		 */

		// Please remember to get the texts from the localization. Add them on the en.i18.json
		let localizedString = i18next.t("demos.text.regularText");

		// You can make styles at https://pixijs.io/pixi-text-style/
		const textStyle = new TextStyle({
			align: "center",
			fill: ["red", "green", "blue"],
			fillGradientType: 1,
			fillGradientStops: [0, 0.5, 1],
			fontFamily: "ArialRoundedMTBold", //* This name is inside the .css file!
			fontSize: 25,
			fontWeight: "bold", // FontWeight only works if you have a font that supports it! (This one doesn't :P)
			lineJoin: "round",
			stroke: "#ffffff",
			strokeThickness: 5,
			wordWrap: true, // Without this, it will always be a single line unless manually broken with \n
			wordWrapWidth: 400,
			padding: 100,
		});

		const regularText = new Text(localizedString, textStyle);

		/**
		 * BitmapText example. This is overly verbose for explanation purposes. Feel free to write more consise code.
		 * BitmapText is the fastest way to render text, but styling and character support is limited.
		 * This creates a project-wide bitmapfont on the fly.
		 */

		// Please remember to get the texts from the localization. Add them on the en.i18.json
		localizedString = i18next.t("demos.text.bitmapText");

		// This creates a bitmapfont with a TextStyle and associates it with a name.
		// ! That name is PROJECTWIDE! You should only call this ONCE for each style you create.
		// Calling `.from(...)` with the same name twice will overwrite the style!
		BitmapFont.from("UniqueNameForStyle", textStyle);

		const bitmapText = new BitmapText(localizedString, {
			fontName: "UniqueNameForStyle",
			align: "center",
			maxWidth: 400,
		});
		bitmapText.y = regularText.y + regularText.height + 3;

		/**
		 * SDF Text example. This is overly verbose for explanation purposes. Feel free to write more consise code.
		 * SDF Text is as fast as BitmapText, but it can be resized without getting pixelated. If you want crisp text, you want this
		 * This needs an asset to be loaded in the project. Ask Milton how to get one. (MTSDF folder in the local network folder)
		 */

		// Please remember to get the texts from the localization. Add them on the en.i18.json
		localizedString = i18next.t("demos.text.sdfBitmapText");

		const sdfText = new BitmapText(localizedString, {
			fontName: "ArialRoundedMTBold",
			tint: 0x00ff00,
			align: "center",
			maxWidth: 400,
			fontSize: 25,
		});
		sdfText.y = bitmapText.y + bitmapText.height + 3;

		// MTSDF Sprite example. These kind of sprites use funky looking images to get a magical vector like appeareance.
		// Side to side, what it looks with the sdf magic and what the original asset looks like.

		const mtsdfSpriteContainer = new Container();
		let mtsdfSprite: MTSDFSprite;
		let auxSprite: Sprite;

		// instagram logo
		mtsdfSprite = new MTSDFSprite(Texture.from("insta.png"), 4);
		mtsdfSprite.x = auxSprite?.x + auxSprite?.width + 3 || 0;
		mtsdfSprite.y = sdfText.y + sdfText.height + 3;
		mtsdfSpriteContainer.addChild(mtsdfSprite);
		auxSprite = new Sprite(Texture.from("insta.png"));
		auxSprite.y = sdfText.y + sdfText.height + 3;
		auxSprite.x = mtsdfSprite.x + mtsdfSprite.width + 3;
		mtsdfSpriteContainer.addChild(auxSprite);

		// whatsapp logo
		mtsdfSprite = new MTSDFSprite(Texture.from("whats.png"), 4);
		mtsdfSprite.x = auxSprite?.x + auxSprite?.width + 3 || 0;
		mtsdfSprite.y = sdfText.y + sdfText.height + 3;
		mtsdfSpriteContainer.addChild(mtsdfSprite);
		auxSprite = new Sprite(Texture.from("whats.png"));
		auxSprite.y = sdfText.y + sdfText.height + 3;
		auxSprite.x = mtsdfSprite.x + mtsdfSprite.width + 3;
		mtsdfSpriteContainer.addChild(auxSprite);

		// spotify logo
		mtsdfSprite = new MTSDFSprite(Texture.from("spot.png"), 4);
		mtsdfSprite.x = auxSprite?.x + auxSprite?.width + 3 || 0;
		mtsdfSprite.y = sdfText.y + sdfText.height + 3;
		mtsdfSpriteContainer.addChild(mtsdfSprite);
		auxSprite = new Sprite(Texture.from("spot.png"));
		auxSprite.y = sdfText.y + sdfText.height + 3;
		auxSprite.x = mtsdfSprite.x + mtsdfSprite.width + 3;
		mtsdfSpriteContainer.addChild(auxSprite);

		/**
		 * Scale the object to see the goodness of the sdf text
		 */
		const scaleContainer = new Container();
		this.addChild(scaleContainer);
		scaleContainer.x = 100;
		scaleContainer.addChild(regularText);
		scaleContainer.addChild(bitmapText);
		scaleContainer.addChild(sdfText);
		scaleContainer.addChild(mtsdfSpriteContainer);
		new Tween(scaleContainer.scale).from({ x: 0.1, y: 0.1 }).to({ x: 10, y: 10 }, 10000).repeat().yoyo().start();
	}
}
