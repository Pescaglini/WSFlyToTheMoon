import vertex from "./NormalMapFilter.vert";
import fragment from "./NormalMapFilter.frag";
import type { Light } from "./Light";
import type { CLEAR_MODES } from "@pixi/constants";
import type { FilterSystem, RenderTexture, Texture } from "@pixi/core";
import { Filter, TextureMatrix } from "@pixi/core";
import { Matrix } from "@pixi/core";
import { utils } from "@pixi/core";
import type { Sprite } from "@pixi/sprite";
export type NormalSprite = Sprite & { normalTexture?: Texture };
export class NormalMapFilter extends Filter {
	public lights: Light[];
	/**
	 * @param {PIXI.Sprite} sprite - the target sprite
	 */
	constructor(numLights: number) {
		let shaderBody = "";
		for (let i = 0; i < numLights; i++) {
			shaderBody += `\n${SHADER_LOOP.replace(/%i%/g, i.toString())}`;
		}
		const finalFragment = fragment.replace(/%numLights%/g, numLights.toString()).replace(/%insertLoopHere%/g, shaderBody);
		super(vertex, finalFragment);
		this.lights = [];
	}
	/**
	 * Applies the filter
	 *
	 * @param {PIXI.FilterSystem} filterManager - The renderer to retrieve the filter from
	 * @param {PIXI.RenderTexture} input - The input render target.
	 * @param {PIXI.RenderTexture} output - The target to output to.
	 * @param {PIXI.CLEAR_MODES} clearMode - Should the output be cleared before rendering to it.
	 */
	public override apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clearMode: CLEAR_MODES): void {
		const targetSprite: NormalSprite = (filterManager as any).activeState.target;
		if (!targetSprite.normalTexture) {
			console.warn("You applied a light to a sprite without a normal map!");
			return;
		}
		const tex = targetSprite.normalTexture;
		if (!tex.valid) {
			return;
		}
		if (!tex.uvMatrix) {
			// margin = 0.0, let it bleed a bit, shader code becomes easier
			// assuming that atlas textures were made with 1-pixel padding
			tex.uvMatrix = new TextureMatrix(tex, 0.0);
		}
		tex.uvMatrix.update();
		this.uniforms.uNomal = tex;
		this.uniforms.Resolution = [filterManager.renderer.width, filterManager.renderer.height];
		// get _normalized sprite texture coords_ and convert them to _normalized atlas texture coords_ with `prepend`
		this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(Matrix.IDENTITY, targetSprite).prepend(tex.uvMatrix.mapCoord);
		this.uniforms.LightPos = [];
		this.uniforms.LightColor = [];
		this.uniforms.AmbientColor = [];
		this.uniforms.Falloff = [];
		for (const light of this.lights) {
			this.uniforms.LightPos.push(...[light.x * filterManager.renderer.resolution, light.y * filterManager.renderer.resolution, light.z]);
			this.uniforms.LightColor.push(...(utils.hex2rgb(light.color) as number[]).concat(light.intensity));
			this.uniforms.AmbientColor.push(...(utils.hex2rgb(light.ambientColor) as number[]).concat(light.ambientIntensity));
			this.uniforms.Falloff.push(...[light.constAtt, light.linearAtt, light.quadAtt]);
			filterManager.applyFilter(this, input, output, clearMode);
		}
	}
}

const SHADER_LOOP = `

//The delta position of light
LightDir = vec3(LightPos[%i%].xy - (juanCarlos), LightPos[%i%].z);

//Determine distance (used for attenuation) BEFORE we normalize our LightDir
D = length(LightDir);

//normalize our vectors
N = normalize(NormalMap * 2.0 - 1.0);
L = normalize(LightDir);

//Pre-multiply light color with intensity
//Then perform "N dot L" to determine our diffuse term
Diffuse = (LightColor[%i%].rgb * LightColor[%i%].a) * max(dot(N, L), 0.0);

//pre-multiply ambient color with intensity
Ambient = AmbientColor[%i%].rgb * AmbientColor[%i%].a;

//calculate attenuation
Attenuation = 1.0 / ( Falloff[%i%].x + (Falloff[%i%].y*D) + (Falloff[%i%].z*D*D) );

//the calculation which brings it all together
Intensity = Ambient + Diffuse * Attenuation;
FinalColor += DiffuseColor.rgb * Intensity;`;
