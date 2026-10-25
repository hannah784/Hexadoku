export const SIDE = 16;
export const BOX_SIDE = 4;
export const CELLS = SIDE * SIDE;
/** 0 = empty; 1..16 represent symbols 0..F. */
export type Board = Uint8Array;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export const TARGETS: Record<Difficulty, number> = { Easy: 154, Medium: 115, Hard: 96 };
export interface SolveStats { nodes: number; ms: number; usedGivensOnly: boolean }
export interface Snapshot { board: Board; notes: Uint16Array }
export interface GameState extends Snapshot {
  givens: Board;
  solution: Board;
  difficulty: Difficulty;
  unique: boolean;
  checks: number;
  selected: number;
  status: 'idle' | 'generating' | 'solving' | 'complete';
  message: string;
  history: Snapshot[];
  future: Snapshot[];
  stats: SolveStats | null;
  moves: number;
  hints: number;
  seconds: number;
  notesMode: boolean;
  markRepeated: boolean;
  showCandidates: boolean;
  checked: boolean;
}
export interface WorkerResponse {
  solved: boolean; aborted: boolean; nodes: number; ms: number; board: Board;
  solution?: Board; checks?: number; unique?: boolean;
}
export type WorkerRequest = { kind: 'generate'; difficulty: Difficulty } | { kind: 'solve' | 'restore'; board: Board };
