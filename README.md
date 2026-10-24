# Hexadoku 16×16

React + Vite + TypeScript + CSS Modules.

```bash
npm install
npm run dev      # development server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

Input alphabet: `0-9` and `A-F` (case-insensitive). Arrow keys move between cells.

```
src/
├── components/   Board, Cell, ControlPanel, ComplexityPanel
├── hooks/        useSudoku (useReducer + localStorage)
├── styles/       App.module.css
├── types/        shared types and constants
├── utils/        sudokuLogic (bitmask MRV solver, generator), complexityData
├── workers/      sudokuWorker (Web Worker, zero-copy transfer)
├── App.tsx
└── main.tsx
```
