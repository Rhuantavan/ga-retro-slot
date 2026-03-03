# GA Slot Machine Task

Simple slot machine prototype built with TypeScript and Pixi.js.

## Setup

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Build

```bash
npm run build
npm run preview
```

## Features

-   3 reels
-   Spin button triggers animation
-   Horizontal line win evaluation
-   Returns final stop symbols, win state, and winning lines

## Forced Result (Testing)

Add the following URL parameter to force a deterministic win (7's across the middle row):

    ?forceResult=true

Example:

    http://localhost:5173/?forceResult=true
