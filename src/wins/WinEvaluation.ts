import type { SymbolId } from "../assets/Assets";

export type WinningLine = {
    row: number;
    symbol: SymbolId;
};

export type WinResult = {
    stops: SymbolId[][];
    hasWin: boolean;
    winningLines: WinningLine[];
};

export class WinEvaluation {
    static evaluateHorizontal(stops: SymbolId[][]): WinResult {
        const reelCount = stops.length;
        const rows = reelCount > 0 ? stops[0].length : 0;

        const winningLines: WinningLine[] = [];

        for (let row = 0; row < rows; row++) {
            const line: SymbolId[] = [];
            for (let r = 0; r < reelCount; r++) {
                line.push(stops[r][row]);
            }

            const first = line[0];
            const allSame = line.every(s => s === first);

            if (allSame) {
                winningLines.push({ row, symbol: first });
            }
        }

        return {
            stops,
            hasWin: winningLines.length > 0,
            winningLines,
        };
    }
}