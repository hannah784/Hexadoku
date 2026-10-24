export const SIDE = 16;
export const BOX_SIDE = 4;
export const CELLS = SIDE * SIDE;

/** Flat board: index = row * 16 + col. 0 = empty, 1..16 = digit 0..F. */
export type Board = Uint8Array;

/** Read-only view of a cell, derived from the flat arrays for rendering. */
export interface Cell {
  index: number;
  value: number;
  fixed: boolean;
  conflict: boolean;
}

export type GameStatus = 'idle' | 'solving' | 'solved' | 'complete' | 'failed';

export interface SolveStats {
  nodes: number;
  ms: number;
  usedGivensOnly: boolean;
}

export interface GameState {
  board: Board;
  givens: Board; // non-zero entries are fixed (initial puzzle) cells
  conflicts: Uint8Array; // 1 where the cell duplicates a row/col/box peer
  selected: number;
  status: GameStatus;
  message: string;
  history: Board[]; // undo stack
  stats: SolveStats | null;
}

export type Action =
  | { type: 'SET_CELL'; index: number; value: number }
  | { type: 'SELECT_CELL'; index: number }
  | { type: 'RESET_BOARD' }
  | { type: 'NEW_GAME'; puzzle: Board }
  | { type: 'UNDO' }
  | { type: 'CHECK' }
  | { type: 'SOLVE_START' }
  | { type: 'SOLVE_COMPLETE'; board: Board; stats: SolveStats }
  | { type: 'SOLVE_FAIL'; message: string }
  | { type: 'LOAD_STATE'; board: Board; givens: Board };

export interface WorkerResponse {
  solved: boolean;
  aborted: boolean;
  nodes: number;
  ms: number;
  board: Uint8Array;
}
