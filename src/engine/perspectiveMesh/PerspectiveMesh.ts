/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/naming-convention */
import vert from "./correct.vert";
import frag from "./correct.frag";
import type { Renderer } from "@pixi/core";
import { Program, Texture } from "@pixi/core";
import type { IDestroyOptions } from "@pixi/display";
import { Point } from "@pixi/core";
import { Mesh, MeshMaterial } from "@pixi/mesh";
import { PlaneGeometry } from "@pixi/mesh-extras";

/**
 * The SimplePlane allows you to draw a texture across several points and then manipulate these points
 *
 *```js
 * for (let i = 0; i < 20; i++) {
 *     points.push(new PIXI.Point(i * 50, 0));
 * };
 * let SimplePlane = new PIXI.SimplePlane(PIXI.Texture.from("snake.png"), points);
 *  ```
 *
 * @class
 * @extends PIXI.Mesh
 * @memberof PIXI
 *
 */
export class PerspectiveMesh extends Mesh {
	public override set texture(value: Texture) {
		// Track texture same way sprite does.
		// For generated meshes like NineSlicePlane it can change the geometry.
		// Unfortunately, this method might not work if you directly change texture in material.
		if (this.shader.texture === value) {
			return;
		}
		this.shader.texture = value;
		this._textureID = -1;
		if (value.baseTexture.valid) {
			this.refreshProjection();
		} else {
			value.once("update", this.refreshProjection, this);
		}
	}
	public override get texture(): Texture {
		return this.shader.texture;
	}

	/**
	 * The geometry is automatically updated when the texture size changes
	 */
	public autoResize: boolean;
	protected _textureID: number;

	constructor(texture: Texture) {
		const planeGeometry = new PlaneGeometry(texture.width, texture.height, 2, 2);
		planeGeometry.addAttribute("aQ", [1, 1, 1, 1], 1);

		const meshMaterial = new MeshMaterial(Texture.WHITE, {
			program: Program.from(vert, frag),
		});
		super(planeGeometry, meshMaterial);
		// lets call the setter to ensure all necessary updates are performed
		this.texture = texture;
		this.autoResize = true;
	}
	/**
	 * Method used for overrides, to do something in case texture frame was changed.
	 * Meshes based on plane can override it and change more details based on texture.
	 */
	public refreshProjection(): void {
		this._textureID = this.shader.texture._updateID;
		const geometry: PlaneGeometry = this.geometry as any;
		const { width, height } = this.shader.texture;
		if (this.autoResize && (geometry.width !== width || geometry.height !== height)) {
			geometry.width = this.shader.texture.width;
			geometry.height = this.shader.texture.height;
			geometry.build();
		}

		// Fix projection
		const vp = this.geometry.getBuffer("aVertexPosition");
		const qs = PerspectiveMesh.FindQ(
			new Point(vp.data[0], vp.data[1]),
			new Point(vp.data[6], vp.data[7]),
			new Point(vp.data[2], vp.data[3]),
			new Point(vp.data[4], vp.data[5])
		);
		const tc = this.geometry.getBuffer("aTextureCoord");

		tc.data[0] = qs[0] * 0;
		tc.data[1] = qs[0] * 0;

		tc.data[2] = qs[1];
		tc.data[3] = qs[1] * 0;

		tc.data[4] = qs[2] * 0;
		tc.data[5] = qs[2];

		tc.data[6] = qs[3];
		tc.data[7] = qs[3];
		tc.update();

		const aQ = this.geometry.getBuffer("aQ");
		aQ.data[0] = qs[0]; //	1
		aQ.data[1] = qs[1]; //	3
		aQ.data[2] = qs[2]; //	0
		aQ.data[3] = qs[3]; //	2
		aQ.update();
	}
	override _render(renderer: Renderer): void {
		if (this._textureID !== this.shader.texture._updateID) {
			this.refreshProjection();
		}
		super._render(renderer);
	}
	public override destroy(options?: IDestroyOptions | boolean): void {
		this.shader.texture.off("update", this.refreshProjection, this);
		super.destroy(options);
	}

	private static FindQ(v1: Point, v2: Point, v3: Point, v4: Point): [number, number, number, number] {
		// detects intersection of two diagonal lines
		const divisor = (v4.y - v3.y) * (v2.x - v1.x) - (v4.x - v3.x) * (v2.y - v1.y);
		const ua = ((v4.x - v3.x) * (v1.y - v3.y) - (v4.y - v3.y) * (v1.x - v3.x)) / divisor;
		const ub = ((v2.x - v1.x) * (v1.y - v3.y) - (v2.y - v1.y) * (v1.x - v3.x)) / divisor;

		// calculates the intersection point
		const centerX = v1.x + ua * (v2.x - v1.x);
		const centerY = v1.y + ub * (v2.y - v1.y);
		const center = new Point(centerX, centerY);

		// determines distances to center for all vertexes
		const d1: number = PerspectiveMesh.len(PerspectiveMesh.sub(v1, center));
		const d2: number = PerspectiveMesh.len(PerspectiveMesh.sub(v2, center));
		const d3: number = PerspectiveMesh.len(PerspectiveMesh.sub(v3, center));
		const d4: number = PerspectiveMesh.len(PerspectiveMesh.sub(v4, center));

		// calculates quotients used as w component in uvw texture mapping
		const q1 = Number.isNaN(d2) || d2 == 0.0 ? 1.0 : (d1 + d2) / d2;
		const q2 = Number.isNaN(d1) || d1 == 0.0 ? 1.0 : (d2 + d1) / d1;
		const q3 = Number.isNaN(d4) || d4 == 0.0 ? 1.0 : (d3 + d4) / d4;
		const q4 = Number.isNaN(d3) || d3 == 0.0 ? 1.0 : (d4 + d3) / d3;

		return [q1, q3, q4, q2];
	}

	private static sub(v1: Point, v2: Point): Point {
		return new Point(v1.x - v2.x, v1.y - v2.y);
	}
	private static len(v1: Point): number {
		return Math.sqrt(Math.pow(v1.x, 2) + Math.pow(v1.y, 2));
	}
}
