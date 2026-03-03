import { Application, Container, Sprite, Text, TextStyle } from 'pixi.js';
import { AssetLoader } from './assets/AssetLoader';
import { Button } from './ui/Button';
import type { SymbolId } from './assets/Assets';
import { WinEvaluation } from './wins/WinEvaluation';
import { Reels } from './reels/Reels';

type GameState = 'idle' | 'spinning' | 'result';

export class Game {
	private readonly app: Application;
	private readonly assets = new AssetLoader();
	private container!: Container;
	private reels!: Reels;
	private spinBtn!: Button;
	private winLabel!: Text;

	private forcedMatrix?: SymbolId[][];
	private state: GameState = 'idle';

	constructor(app: Application) {
		this.app = app;
	}

	async start(): Promise<void> {
		await this.ensureFontLoaded();
		await this.assets.loadAll();

		this.container = new Container();
		this.app.stage.addChild(this.container);

		this.setupReels();
		this.setupWinDisplay();
		this.setupSpinButton();

		window.addEventListener('resize', this.onResize);
		this.onResize();

		this.readForceFromUrl();
	}

	destroy() {
		window.removeEventListener('resize', this.onResize);
		this.app.stage.removeChild(this.container);
		this.container?.destroy({ children: true });
	}

	private readForceFromUrl(): void {
		const params = new URLSearchParams(window.location.search);

		const force = params.get('forceResult');
		if (force !== 'true') return;

		this.forcedMatrix = [
			['bar', 'seven', 'plum'],
			['bell', 'seven', 'lemon'],
			['cherry', 'seven', 'wild'],
		];
	}

	async ensureFontLoaded() {
		await document.fonts.load('700 24px "Pixelify"');
		await document.fonts.ready;
	}

	private setupReels() {
		const frame = new Sprite(this.assets.texture('reelFrame'));
		frame.anchor.set(0.5);
		frame.position.set(this.app.renderer.width * 0.5 - 200, this.app.renderer.height * 0.5);
		this.container.addChild(frame);

		this.reels = new Reels(this.app.ticker, this.assets, {
			reelCount: 3,
			reelSpacing: 285,
			spinBaseMs: 2000,
			spinStaggerMs: 250,
			reel: { visibleRows: 3, symbolSize: 248, gap: 0 },
		});

		this.reels.position.set(0, -22);
		frame.addChild(this.reels);
	}

	private setupWinDisplay() {
		const winDisplay = new Container();
		this.container.addChild(winDisplay);

		const winField = new Sprite(this.assets.texture('winField'));
		winField.position.set(1250, 0);
		winDisplay.addChild(winField);

		const style = new TextStyle({
			fontFamily: "Pixelify",
			fontSize: 100,
			fill: 0x00FFA4,
			align: "center"
		});

		this.winLabel = new Text({ text: "", style });
		this.winLabel.anchor.set(0.5, 0.5);
		this.winLabel.position.set(1506, 300);
		winDisplay.addChild(this.winLabel);
	}

	private setupSpinButton(): void {
		const button = new Button({
			texture: this.assets.texture('spinButton'),
		});

		button.position.set(1500, 800);
		button.onClick = () => this.onSpinClicked();

		this.container.addChild(button);
		this.spinBtn = button;
	}

	private async onSpinClicked(): Promise<void> {
		if (this.state !== 'idle') return;

		this.winLabel.text = '';

		this.state = 'spinning';
		this.spinBtn.alpha = 0.7;

		const stops = await this.reels.spinAll(this.forcedMatrix);

		this.state = 'result';
		this.spinBtn.alpha = 1;

		const result = WinEvaluation.evaluateHorizontal(stops);

		if (result.hasWin) {
			this.winLabel.text = result.winningLines.map(l => l.symbol).join(', ');
		} else {
			this.winLabel.text = '';
		}

		this.state = 'idle';
	}


	private onResize = (): void => {
		const canvas = this.app.canvas;
		if (!canvas) return;

		const maxWidth = 1920;
		const maxHeight = 1080;

		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		const scale = Math.min(
			windowWidth / maxWidth,
			windowHeight / maxHeight,
			1
		);

		canvas.style.width = `${maxWidth * scale}px`;
		canvas.style.height = `${maxHeight * scale}px`;
	};
}