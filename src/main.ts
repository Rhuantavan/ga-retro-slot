import { Application } from 'pixi.js';
import { Game } from './Game.ts';

async function init() {
	const app = new Application();

	await app.init({
		width: 1920,
		height: 1080,
		backgroundColor: 0x000000
	});

	//globalThis.__PIXI_APP__ = app;

	document.body.appendChild(app.canvas);

	const game = new Game(app);
	game.start();
}

init();