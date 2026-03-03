import { Container, Sprite, Text, TextStyle } from 'pixi.js';
import type { Texture } from 'pixi.js';

type ButtonOptions = {
	texture: Texture;
	text?: string;
	width?: number;
	height?: number;
};

export class Button extends Container {
	private readonly bg: Sprite;
	private caption?: Text;

	private _enabled = true;
	private _onClick?: () => void;

	constructor(options: ButtonOptions) {
		super();

		this.bg = new Sprite(options.texture);
		this.bg.anchor.set(0.5);

		if (options.width !== undefined) this.bg.width = options.width;
		if (options.height !== undefined) this.bg.height = options.height;

		this.addChild(this.bg);

		if (options.text) {
			this.caption = new Text({
				text: options.text,
				style: new TextStyle({
					fontFamily: 'Pixelify',
					fontSize: 32,
					fill: 0xffffff,
				}),
			});

			this.caption.anchor.set(0.5);
			this.caption.position.set(0, 2);
			this.addChild(this.caption);
		}

		this.eventMode = 'static';
		this.cursor = 'pointer';

		this.setupInteractions();
	}

	set onClick(cb: (() => void) | undefined) {
		this._onClick = cb;
	}

	set enabled(value: boolean) {
		this._enabled = value;
		this.alpha = value ? 1 : 0.5;
		this.eventMode = value ? 'static' : 'none';
		this.cursor = value ? 'pointer' : 'default';
		this.scale.set(1);
	}

	get enabled(): boolean {
		return this._enabled;
	}

	setText(text: string): void {
		if (!this.caption) {
			this.caption = new Text({
				text,
				style: new TextStyle({
					fontFamily: 'Pixelify',
					fontSize: 32,
					fill: 0xffffff,
				}),
			});
			this.caption.anchor.set(0.5);
			this.caption.position.set(0, 2);
			this.addChild(this.caption);
			return;
		}

		this.caption.text = text;
	}

	private setupInteractions(): void {
		this.on('pointerover', () => {
			if (!this._enabled) return;
			this.scale.set(1.05);
		});

		this.on('pointerout', () => {
			if (!this._enabled) return;
			this.scale.set(1);
		});

		this.on('pointerdown', () => {
			if (!this._enabled) return;
			this.scale.set(0.95);
		});

		this.on('pointerup', () => {
			if (!this._enabled) return;
			this.scale.set(1.05);
			this._onClick?.();
		});

		this.on('pointerupoutside', () => {
			if (!this._enabled) return;
			this.scale.set(1);
		});
	}
}