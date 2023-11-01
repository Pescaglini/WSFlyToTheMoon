import { Pane } from "tweakpane";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { Text } from "@pixi/text";
import { Graphics } from "@pixi/graphics";
import eruda from "eruda";

export class ExternalDebuggers extends PixiScene {
	public static readonly BUNDLES = [""];
	// COINS
	private _coins: number = 1000;
	private get coins(): number {
		return this._coins;
	}
	private set coins(value: number) {
		this._coins = value;
		this.coinText.text = `COINS: ${this.coins}`;
	}
	private coinText: Text;

	// XP
	private _xp: number = 0;
	private get xp(): number {
		return this._xp;
	}
	private set xp(value: number) {
		this._xp = value;
		this.xpText.text = `LEVEL: ${1 + Math.floor(this.xp / 100)}`;
	}
	private xpText: Text;

	constructor() {
		super();
		this.eventMode = "static";
		const bg = new Graphics();
		bg.beginFill(0xcccccc).drawRect(-10, -10, 220, 120).endFill();
		bg.position.set(100);
		this.addChild(bg);

		this.coinText = new Text(`COINS: ${this.coins}`, { fill: 0x000000, fontSize: 30 });
		this.xpText = new Text(`LEVEL: ${Math.floor(1 + this.xp / 100)}`, { fill: 0x000000, fontSize: 30 });
		this.xpText.y = 60;
		bg.addChild(this.coinText, this.xpText);

		// ---- TWEAKPANE ----
		// A pane library for fine-tuning parameters
		this.initializeTweakPane();
		// To install it:
		// pnpm i tweakpane
		// pnpm i @tweakpane/core

		// ---- ERUDA ----
		// A console for mobile browsers
		eruda.init();
		// To install it:
		// pnpm i eruda
	}

	private initializeTweakPane(): void {
		// Pane isn't a pixi object, so it doesn't need a parent... Like batman
		// If you add a title to the pane you can collapse it
		const tweakPane = new Pane({ title: "TWEAKPANE" });

		/** This params exists to be bound to tweakPane bindings */
		const paneParams = {
			mousePos: { x: 0, y: 0 },
			coins: 1000,
			xp: 100,
		};

		const monitorFolder = tweakPane.addFolder({ title: "MONITORING" });
		// Mouse position monitors
		this.on("globalpointermove", (e) => {
			paneParams.mousePos = e.global;
			tweakPane.refresh();
		});
		monitorFolder.addBinding(paneParams, "mousePos", { disabled: true });

		tweakPane.addBlade({
			view: "separator",
		});

		const variablesFolder = tweakPane.addFolder({ title: "VARIABLES", expanded: false });

		const coinsFolder = variablesFolder.addFolder({ title: "COINS" });

		coinsFolder.addBinding(paneParams, "coins", { min: 1, max: 10000, step: 1, label: "amount" });
		const addCoins = coinsFolder.addButton({ title: "ADD" });
		addCoins.on("click", () => {
			const result = this.coins + paneParams.coins;
			this.coins = result > 100000 ? 100000 : result;
		});
		const removeCoins = coinsFolder.addButton({ title: "REMOVE" });
		removeCoins.on("click", () => {
			const result = this.coins - paneParams.coins;
			this.coins = result < 0 ? 0 : result;
		});

		const xpFolder = variablesFolder.addFolder({ title: "XP", expanded: false });
		xpFolder.addBinding(paneParams, "xp", { min: 1, max: 1000, step: 1, label: "amount" });
		const addXp = xpFolder.addButton({ title: "ADD" });
		addXp.on("click", () => {
			this.xp += paneParams.xp;
		});
		xpFolder.addBlade({
			view: "separator",
		});
		const xpReset = xpFolder.addButton({ title: "RESET" });
		xpReset.on("click", () => {
			xpReset.disabled = true;
			confirmReset.disabled = false;
		});

		const confirmReset = xpFolder.addButton({ title: "CONFIRM", disabled: true });
		confirmReset.on("click", () => {
			xpReset.disabled = false;
			confirmReset.disabled = true;
			this.xp = 0;
		});
	}
}
