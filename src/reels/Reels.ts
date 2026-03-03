import { Container, Sprite, type Ticker } from 'pixi.js';
import type { AssetLoader } from '../assets/AssetLoader';
import { SYMBOL_IDS, type SymbolId } from '../assets/Assets';
import { Reel, type ReelConfig } from './Reel';

export type ReelsConfig = {
    reelCount: number;      // N reels
    reelSpacing: number;    
    spinBaseMs: number;     // base spin duration
    spinStaggerMs: number;  // delay between reels
    reel: ReelConfig;
};

export class Reels extends Container {
    private readonly ticker: Ticker;
    private readonly assets: AssetLoader;
    private readonly cfg: ReelsConfig;

    private readonly reels: Reel[] = [];
    private readonly separators: Sprite[] = [];

    constructor(ticker: Ticker, assets: AssetLoader, cfg: ReelsConfig) {
        super();

        this.ticker = ticker;
        this.assets = assets;
        this.cfg = cfg;

        this.createReels();
        this.createSeparators();
        this.layoutReels();
    }

    getStops(): SymbolId[][] {
        return this.reels.map(r => r.stopSymbols.slice());
    }

    async spinAll(forceResults?: SymbolId[][]): Promise<SymbolId[][]> {
        const outcome = this.generateOutcome(forceResults);

        const tasks = this.reels.map((reel, i) => {
            const ms = this.cfg.spinBaseMs + i * this.cfg.spinStaggerMs;
            return reel.spinTo(outcome[i], ms, 3);
        });

        await Promise.all(tasks);
        return this.getStops();
    }

    private createReels(): void {
        for (let i = 0; i < this.cfg.reelCount; i++) {
            const reel = new Reel(this.ticker, this.assets, this.cfg.reel);
            this.reels.push(reel);
            this.addChild(reel);
        }
    }

    private createSeparators(): void {
        const count = this.cfg.reelCount;

        for (let i = 0; i < count - 1; i++) {
            const sep = new Sprite(this.assets.texture('separator'));
            sep.anchor.set(0.5);
            this.separators.push(sep);
            this.addChild(sep);
        }
    }

    private layoutReels(): void {
        const count = this.reels.length;
        const spacing = this.cfg.reelSpacing;
        const startX = -((count - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            const x = startX + i * spacing;
            this.reels[i].position.set(x, 0);

            // Separator between this reel and next one
            if (i < count - 1) {
                const sepX = x + spacing / 2;
                this.separators[i].position.set(sepX, 0);
            }
        }
    }

    // forceResults: [reelIndex][rowIndex]
    private generateOutcome(forceResults?: SymbolId[][]): SymbolId[][] {
        const rows = this.cfg.reel.visibleRows;

        const hasForce = !!forceResults && forceResults.length > 0;
        if (!hasForce) {
            // Randomize symbols per reel
            return this.reels.map(() => this.randomStops(rows));
        }

        const out: SymbolId[][] = [];

        for (let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
            const forcedForReel = forceResults?.[reelIndex] ?? [];
            const stops: SymbolId[] = [];

            for (let row = 0; row < rows; row++) {
                const forced = forcedForReel[row];
                stops.push(forced ?? this.randomSymbol()); // forced vs random
            }

            out.push(stops);
        }

        return out;
    }

    private randomStops(rows: number): SymbolId[] {
        const out: SymbolId[] = [];
        for (let i = 0; i < rows; i++) out.push(this.randomSymbol());
        return out;
    }

    private randomSymbol(): SymbolId {
        return SYMBOL_IDS[(Math.random() * SYMBOL_IDS.length) | 0];
    }
}