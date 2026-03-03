import { Container, Graphics, Sprite, type Ticker } from 'pixi.js';
import type { AssetLoader } from '../assets/AssetLoader';
import { SYMBOL_IDS, type SymbolId } from '../assets/Assets';
import { easeInCubic, easeOutQuad, easeOutBack, lerp } from '../utils/Easings';

export type ReelConfig = {
    visibleRows: number;
    symbolSize: number;
    gap?: number;
    bufferRows?: number;
};

export class Reel extends Container {
    private readonly ticker: Ticker;
    private readonly assets: AssetLoader;
    private readonly cfg: Required<ReelConfig>;

    private readonly strip = new Container();
    private readonly maskGfx = new Graphics();

    private sprites: Sprite[] = [];
    private _stopSymbols: SymbolId[] = [];

    private readonly nTop = 1; // n of syms above the visible section
    private readonly nBottom = 1; // below

    constructor(ticker: Ticker, assets: AssetLoader, cfg: ReelConfig) {
        super();

        this.ticker = ticker;
        this.assets = assets;

        this.cfg = {
            visibleRows: cfg.visibleRows,
            symbolSize: cfg.symbolSize,
            gap: cfg.gap ?? 8,
            bufferRows: cfg.bufferRows ?? cfg.visibleRows * 2,
        };

        this.addChild(this.strip);
        this.addChild(this.maskGfx);

        this.applyMask();
        this.setStop(this.randomStops());
    }

    get stopSymbols(): readonly SymbolId[] {
        return this._stopSymbols;
    }

    async spinTo(stopSymbols: SymbolId[], durationMs: number, extraTurns = 0): Promise<void> {
        const step = this.symStepY(); // Step-based indexing so the reel always stops perfectly aligned.

        const startStops = this._stopSymbols.length ? this._stopSymbols.slice() : this.randomStops(); // current
        const targetStops = stopSymbols.slice(); // target
        this._stopSymbols = targetStops;

        const buffer = this.cfg.bufferRows;
        const extraSymbols = Math.max(0, extraTurns) * this.cfg.visibleRows;
        const travel = buffer + extraSymbols;

        // Build strip so current stop is visible at rest and target stop exists earlier in the strip.
        const list: SymbolId[] = [
            ...this.randomList(this.nTop),
            ...targetStops,
            ...this.randomList(travel),
            ...startStops,
            ...this.randomList(buffer),
        ];

        this.setSymbols(list);

        const startIndex = this.nTop + targetStops.length + travel;
        const fromY = -(startIndex * step);
        this.strip.y = fromY;

        const targetIndex = this.nTop;
        const toY = -(targetIndex * step);

        await this.tweenY(fromY, toY, durationMs);

        this.strip.y = toY;
        this.trimToStop();
    }

    private randomList(count: number): SymbolId[] {
        const out: SymbolId[] = [];
        for (let i = 0; i < count; i++) out.push(this.randomSymbol());
        return out;
    }

    setStop(stop: SymbolId[]): void {
        this._stopSymbols = stop.slice();
        this.setSymbols(stop);
        this.strip.y = 0;
    }

    private applyMask(): void {
        const w = this.cfg.symbolSize;
        const h = this.cfg.visibleRows * this.cfg.symbolSize + (this.cfg.visibleRows - 1) * this.cfg.gap;

        this.maskGfx.clear();
        this.maskGfx.rect(-w / 2, -h / 2, w, h).fill({ color: 0xffffff, alpha: 1 });

        this.strip.mask = this.maskGfx;
    }

    private setSymbols(list: SymbolId[]): void {
        this.strip.removeChildren();

        for (const s of this.sprites) s.destroy();
        this.sprites = [];

        for (let i = 0; i < list.length; i++) {
            const spr = new Sprite(this.assets.texture(list[i]));
            spr.anchor.set(0.5);
            spr.width = this.cfg.symbolSize;
            spr.height = this.cfg.symbolSize;

            this.strip.addChild(spr);
            this.sprites.push(spr);
        }

        this.layoutStrip();
    }

    private layoutStrip(): void {
        const step = this.symStepY();
        const h = this.cfg.visibleRows * this.cfg.symbolSize + (this.cfg.visibleRows - 1) * this.cfg.gap;
        const topY = -h / 2 + this.cfg.symbolSize / 2;

        for (let i = 0; i < this.sprites.length; i++) {
            this.sprites[i].position.set(0, topY + i * step);
        }
    }

    private trimToStop(): void {
        const list: SymbolId[] = [];
        for (let i = 0; i < this.nTop; i++) list.push(this.randomSymbol());
        for (const s of this._stopSymbols) list.push(s);
        for (let i = 0; i < this.nBottom; i++) list.push(this.randomSymbol());

        this.setSymbols(list);

        const step = this.symStepY();
        this.strip.y = -(this.nTop * step);
    }

    private symStepY(): number {
        return this.cfg.symbolSize + this.cfg.gap;
    }

    private randomStops(): SymbolId[] {
        const out: SymbolId[] = [];
        for (let i = 0; i < this.cfg.visibleRows; i++) out.push(this.randomSymbol());
        return out;
    }

    private randomSymbol(): SymbolId {
        return SYMBOL_IDS[(Math.random() * SYMBOL_IDS.length) | 0];
    }

    private tweenY(from: number, to: number, durationMs: number): Promise<void> {
        if (durationMs <= 0) {
            this.strip.y = to;
            return Promise.resolve();
        }

        const preNudgePx = 18;
        const overshootPx = 50;
        const t0 = 0.10;
        const t1 = 0.85;

        const y0 = from;
        const yPre = from - preNudgePx;
        const yOvershoot = to + overshootPx;
        const yEnd = to;

        return new Promise<void>((resolve) => {
            let elapsedMs = 0;

            const tick = (ticker: Ticker): void => {
                elapsedMs += ticker.deltaMS;
                const p = Math.min(1, elapsedMs / durationMs);

                let y: number;

                if (p < t0) {
                    const u = p / t0;
                    y = lerp(y0, yPre, easeOutQuad(u));
                } else if (p < t1) {
                    const u = (p - t0) / (t1 - t0);
                    y = lerp(yPre, yOvershoot, easeInCubic(u));
                } else {
                    const u = (p - t1) / (1 - t1);
                    y = lerp(yOvershoot, yEnd, easeOutBack(u));
                }

                this.strip.y = y;

                if (p >= 1) {
                    this.ticker.remove(tick);
                    this.strip.y = to;
                    resolve();
                }
            };

            this.ticker.add(tick);
        });
    }
}