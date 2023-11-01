import { pixiManifest } from "@assetpack/plugin-manifest";
// import { texturePacker } from "@assetpack/plugin-texture-packer";
import { klymenePacker } from "@klymene/assetpack"
import { webfont, msdfFont } from "@assetpack/plugin-webfont";
import { ffmpeg } from "@assetpack/plugin-ffmpeg";

export default {
	entry: "./assets",
	output: "./generated",
	plugins: {
		klymenePacker: klymenePacker({
			packerSettings: {
				width: 2048,
				height: 2048,
				oversizedBehaviour: "special",
				fixedSize: false,
				powerOfTwo: true,
				sqaure: false,
				padding: 2,
				extrude: 4,
				extrudeMethod: "copy",
				allowRotation: true,
				detectIdentical: true,
				trimMode: "trim",
				alphaThreshold: 0,
				removeFileExtension: false,
				removeFolderName: false,
				scale: 1,
				scaleMethod: "nearest",
				// newRoot: ""
			},
			outputSettings: [ // Loseless export since webpack will compress later
				{
					descriptorFileName: "atlas#.png",
					textureFileName: "atlas#",
					textureFormat: {
						id: "png",
						compressionLevel: 0,
						effort: 1,
						quality: 100,
					}
				},
				{
					descriptorFileName: "atlas#.webp",
					textureFileName: "atlas#",
					textureFormat: {
						id: "webp",
						lossless: true,
						effort: 0
					},
				},
				{
					descriptorFileName: "atlas#.avif",
					textureFileName: "atlas#",
					textureFormat: {
						id: "avif",
						effort: 0,
						lossless: true,
					},
				}
			]
		}),
		ffmpeg: ffmpeg({
			inputs: ['.mp3', '.ogg', '.wav', '.m4a'],
			outputs: [
				{
					formats: ['.m4a'],
					recompress: false,
					options: {
						audioCodec: "aac",
						withNoVideo: "",
						audioBitrate: 32,
						audioChannels: 1,
						audioFrequency: 22050,
					}
				},
				{
					formats: ['.ogg'],
					recompress: false,
					options: {
						audioBitrate: 32,
						audioChannels: 1,
						audioFrequency: 22050,
					}
				},
				{
					formats: ['.mp3'],
					recompress: false,
					options: {
						audioBitrate: 96,
						audioChannels: 1,
						audioFrequency: 48000,
					}
				}
			]
		}), // processes all '.mp3', '.ogg', '.wav', '.m4a' files. no tag needed.

		webfont: webfont(), // put into a folder with {wf}
		msdfFont: msdfFont(
			{
				font: {
					charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890 \"!`?'.,;:()[]{}<>|/@\\^$-%+=#_&~*¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ".split(""), // ugly hack to get quite a lot of characters
					textureWidth: 2048,
					textureHeight: 2048,
					distanceRange: 6,
					fontSize: 48,
					fieldType: "msdf",
					smartSize: true,
					pot: true,
					square: false,
					rot: false,
				}
			}
		), // put into a folder with {msdf}
		manifest: pixiManifest(), // add {m} to the folder
	},
};

// first 255 characters of unicode


