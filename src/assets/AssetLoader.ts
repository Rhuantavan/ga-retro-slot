import { Assets, Texture } from 'pixi.js';
import { assetUrls } from "./Assets";
import type { AssetKey } from "./Assets";

export class AssetLoader {
	private loaded = false;

	async loadAll(): Promise<void> {
		if (this.loaded) return;

		await Assets.load(Object.values(assetUrls));
		this.loaded = true;
	}

	texture(key: AssetKey): Texture {
		if (!this.loaded) {
			throw new Error(`Assets not loaded. Tried to access texture "${key}".`);
		}
		return Texture.from(assetUrls[key]);
	}
}