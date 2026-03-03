export const assets = {
	symbols: {
		bar:	'assets/images/symbols/Bar.png',
		bell:	'assets/images/symbols/Bell.png',
		cherry:	'assets/images/symbols/Cherry.png',
		diamond:'assets/images/symbols/Diamond.png',
		lemon:  'assets/images/symbols/Lemon.png',
		plum:	'assets/images/symbols/Plum.png',
		seven:	'assets/images/symbols/Seven.png',
		wild:	'assets/images/symbols/Wild.png',
	},
	ui: {
		reelFrame:	'assets/images/ui/ReelFrame.png',
		separator:	'assets/images/ui/ReelSeparator.png',
		spinButton:	'assets/images/ui/SpinButton.png',
		winField:	'assets/images/ui/WinField.png',
		betField:	'assets/images/ui/BetField.png',
	},
} as const;

export const assetUrls = { ...assets.symbols, ...assets.ui } as const;
export type AssetKey = keyof typeof assetUrls;
export type SymbolId = keyof typeof assets.symbols;
export type UiAssetId = keyof typeof assets.ui;

export const SYMBOL_IDS = Object.keys(assets.symbols) as SymbolId[];