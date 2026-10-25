import { CELLS, type Board, type GameState, type Snapshot } from '../types';
import { BOX, COL, ROW, isComplete } from './sudokuLogic';

export const AUTOSAVE_KEY = 'hexadoku:autosave:v2';
const LIMIT = 200;
export function blankState(): GameState {
  return { board: new Uint8Array(CELLS), givens: new Uint8Array(CELLS), solution: new Uint8Array(CELLS),
    notes: new Uint16Array(CELLS), difficulty: 'Easy', unique: false, checks: 0, selected: 0,
    status: 'generating', message: 'Generating a unique puzzle…', history: [], future: [], stats: null,
    moves: 0, hints: 0, seconds: 0, notesMode: false, markRepeated: true, showCandidates: false, checked: false };
}
const snapshot = (s: Snapshot): Snapshot => ({ board: s.board, notes: s.notes });
function changed(s: GameState, board: Board, notes: Uint16Array): GameState {
  const complete = isComplete(board);
  return { ...s, board, notes, history: [...s.history.slice(-(LIMIT - 1)), snapshot(s)], future: [],
    moves: s.moves + 1, checked: false, status: complete ? 'complete' : 'idle',
    message: complete ? 'Puzzle complete. Nicely done!' : '' };
}
export type GameAction =
  | { type: 'EDIT'; index: number; value: number; hint?: boolean }
  | { type: 'ERASE' } | { type: 'UNDO' } | { type: 'REDO' } | { type: 'RESET' }
  | { type: 'SELECT'; index: number } | { type: 'TICK'; seconds: number }
  | { type: 'TOGGLE'; key: 'notesMode' | 'markRepeated' | 'showCandidates' }
  | { type: 'CHECK' } | { type: 'MESSAGE'; message: string }
  | { type: 'BUSY'; status: 'generating' | 'solving' }
  | { type: 'CANCEL' } | { type: 'REPLACE'; state: GameState }
  | { type: 'SOLVED'; board: Board; stats: NonNullable<GameState['stats']> };

export function gameReducer(s: GameState, a: GameAction): GameState {
  const busy = s.status === 'solving' || s.status === 'generating';
  switch (a.type) {
    case 'EDIT': {
      const { index, value } = a;
      if (busy || s.givens[index] || index < 0 || index >= CELLS || value < 0 || value > 16) return s;
      const board = s.board.slice(), notes = s.notes.slice();
      if (s.notesMode && value && !a.hint) {
        if (board[index]) return s;
        notes[index] ^= 1 << (value - 1);
      } else {
        if (board[index] === value && !notes[index]) return s;
        board[index] = value; notes[index] = 0;
        if (value) for (let i = 0; i < CELLS; i++) {
          if (ROW[i] === ROW[index] || COL[i] === COL[index] || BOX[i] === BOX[index]) notes[i] &= ~(1 << (value - 1));
        }
      }
      const next = changed(s, board, notes);
      return a.hint ? { ...next, hints: s.hints + 1 } : next;
    }
    case 'ERASE': return { ...gameReducer({ ...s, notesMode: false }, { type: 'EDIT', index: s.selected, value: 0 }), notesMode: s.notesMode };
    case 'SELECT': return { ...s, selected: a.index };
    case 'TICK': return s.status === 'idle' ? { ...s, seconds: s.seconds + a.seconds } : s;
    case 'TOGGLE': return { ...s, [a.key]: !s[a.key] };
    case 'UNDO': case 'REDO': {
      const from = a.type === 'UNDO' ? s.history : s.future;
      if (busy || !from.length) return s;
      const previous = from[from.length - 1];
      return { ...s, ...previous, history: a.type === 'UNDO' ? s.history.slice(0, -1) : [...s.history.slice(-(LIMIT - 1)), snapshot(s)],
        future: a.type === 'REDO' ? s.future.slice(0, -1) : [...s.future.slice(-(LIMIT - 1)), snapshot(s)],
        status: isComplete(previous.board) ? 'complete' : 'idle', checked: false, message: '' };
    }
    case 'RESET': return busy ? s : { ...s, board: s.givens.slice(), notes: new Uint16Array(CELLS), history: [], future: [],
      moves: 0, hints: 0, seconds: 0, checked: false, stats: null, status: 'idle', message: 'Original puzzle restored.' };
    case 'CHECK': {
      let wrong = 0;
      for (let i = 0; i < CELLS; i++) if (s.board[i] && s.board[i] !== s.solution[i]) wrong++;
      return { ...s, checked: true, message: wrong ? `${wrong} incorrect entries marked.` : 'All entries are correct so far.' };
    }
    case 'BUSY': return { ...s, status: a.status, message: a.status === 'solving' ? 'Solving…' : 'Generating a unique puzzle…' };
    case 'CANCEL': return { ...s, status: isComplete(s.board) ? 'complete' : 'idle', message: 'Cancelled.' };
    case 'MESSAGE': return { ...s, status: isComplete(s.board) ? 'complete' : 'idle', message: a.message };
    case 'REPLACE': return a.state;
    case 'SOLVED': return { ...changed(s, a.board, new Uint16Array(CELLS)), stats: a.stats,
      message: a.stats.usedGivensOnly ? 'Solved from the original givens after the current-entry search failed or reached its limit.' : 'Puzzle solved.' };
  }
}

const validArray = (v: unknown, max: number): v is number[] => Array.isArray(v) && v.length === CELLS && v.every(n => Number.isInteger(n) && n >= 0 && n <= max);
export function readSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY) ?? localStorage.getItem('hexadoku:autosave:v1');
    if (!raw) return null;
    const p = JSON.parse(raw);
    // Keep older board-only saves. Their solution is recovered in a worker.
    if (validArray(p.board, 16) && validArray(p.givens, 16) && p.solution === undefined) {
      const board = Uint8Array.from(p.board), givens = Uint8Array.from(p.givens);
      if (givens.some((v, i) => v && v !== board[i])) return null;
      return { ...blankState(), board, givens, message: 'Restoring your previous puzzle…' };
    }
    if (!validArray(p.board, 16) || !validArray(p.givens, 16) || !validArray(p.solution, 16) || !validArray(p.notes, 65535)) return null;
    const board = Uint8Array.from(p.board), givens = Uint8Array.from(p.givens), solution = Uint8Array.from(p.solution);
    if (!isComplete(solution) || givens.some((v, i) => v !== 0 && (v !== board[i] || v !== solution[i]))) return null;
    if (!['Easy', 'Medium', 'Hard'].includes(p.difficulty)) return null;
    const decode = (list: unknown): Snapshot[] => Array.isArray(list) ? list.slice(-LIMIT).flatMap(v =>
      validArray(v?.board, 16) && validArray(v?.notes, 65535) && givens.every((g, i) => !g || g === v.board[i])
        ? [{ board: Uint8Array.from(v.board), notes: Uint16Array.from(v.notes) }] : []) : [];
    const count = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : 0;
    return { ...blankState(), board, givens, solution, notes: Uint16Array.from(p.notes), difficulty: p.difficulty,
      unique: p.unique === true, checks: count(p.checks), moves: count(p.moves), hints: count(p.hints), seconds: count(p.seconds),
      history: decode(p.history), future: decode(p.future), selected: Math.min(255, count(p.selected)),
      markRepeated: p.markRepeated !== false, showCandidates: p.showCandidates === true, notesMode: p.notesMode === true,
      stats: p.stats && Number.isSafeInteger(p.stats.nodes) && p.stats.nodes >= 0 && Number.isFinite(p.stats.ms) && p.stats.ms >= 0
        ? { nodes: p.stats.nodes, ms: p.stats.ms, usedGivensOnly: p.stats.usedGivensOnly === true } : null,
      status: isComplete(board) ? 'complete' : 'idle', message: 'Restored your saved game.' };
  } catch { return null; }
}
export function saveGame(s: GameState): boolean {
  if (!s.solution.some(Boolean)) return false;
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(s, (_key, value) => value instanceof Uint8Array || value instanceof Uint16Array ? Array.from(value) : value));
    return true;
  } catch { return false; }
}
export function hasUnfinishedGame(): boolean {
  const saved = readSaved();
  return saved !== null && saved.status !== 'complete';
}
