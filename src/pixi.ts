/**
 * Connect all pixi.js moving parts.
 */

import "@pixi/mixin-get-global-position";
import "@pixi/mixin-get-child-by-name";
import "@pixi/mixin-cache-as-bitmap";
// import "@pixi/core-extras";
import "@pixi/events";
import "pixi3d/pixi7";

// Renderer plugins
import { extensions } from "@pixi/core";

import { BatchRenderer } from "@pixi/core";
extensions.add(BatchRenderer);
import { ParticleRenderer } from "@pixi/particle-container";
extensions.add(ParticleRenderer);
import { Prepare } from "@pixi/prepare";
extensions.add(Prepare);
import { TilingSpriteRenderer } from "@pixi/sprite-tiling";
extensions.add(TilingSpriteRenderer);
import { MTSDFRenderer } from "./engine/mtsdfSprite/MTSDFRenderer";
extensions.add(MTSDFRenderer);

// Loader plugins

import "@pixi/spritesheet";
import "@pixi/text-bitmap";
import "@pixi/sound";

import "./engine/sdftext/MTSDFFontLoader";
import "./engine/localization/LangLoaderPlugin";
import "./engine/csv/CSVLoader";
import "./engine/csv/SheetsLoader";
