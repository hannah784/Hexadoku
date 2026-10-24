import { useCallback, useEffect, useReducer, useRef } from 'react';
import { CELLS, type Action, type Board, type GameState, type WorkerResponse } from '../types';
import { countEmpty, findConflicts, generatePuzzle, isComplete } from '../utils/sudokuLogic';

const AUTOSAVE_KEY = 'hexadoku:autosave:v1';
const SLOT_KEY = 'hexadoku:slot:v1';
const HISTORY_LIMIT = 200;

interface Saved { board: Board; givens: Board }

function readSaved(key: string): Saved | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as { board?: number[]; givens?: number[] };
    if (!p.board || !p.givens || p.board.length !== CELLS || p.givens.length !== CELLS) return null;
    if (![...p.board, ...p.givens].every((v) => Number.isInteger(v) && v >= 0 && v <= 16)) return null;
    return { board: Uint8Array.from(p.board), givens: Uint8Array.from(p.givens) };
  } catch {
    return null;
  }
}

function writeSaved(key: string, board: Board, givens: Board): boolean {
  try {
    localStorage.setItem(key, JSON.stringify({ board: Array.from(board), givens: Array.from(givens) }));
    return true;
  } catch {
    return false;
  }
}

function makeState(board: Board, givens: Board, message: string): GameState {
  return {
    board, givens, conflicts: findConflicts(board), selected: 0,
    status: isComplete(board) ? 'complete' : 'idle', message, history: [], stats: null,
  };
}

function freshGame(message: string): GameState {
  const { puzzle } = generatePuzzle(0.45);
  return makeState(puzzle.slice(), puzzle, message);
}

function init(): GameState {
  const saved = readSaved(AUTOSAVE_KEY);
  return saved ? makeState(saved.board, saved.givens, 'Restored your previous game.') : freshGame('New puzzle generated.');
}

function pushHistory(history: Board[], board: Board): Board[] {
  const next = history.length >= HISTORY_LIMIT ? history.slice(1) : history.slice();
  next.push(board);
  return next;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_CELL': {
      const { index, value } = action;
      if (state.givens[index] !== 0 || state.board[index] === value || state.status === 'solving') return state;
      const board = state.board.slice();
      board[index] = value;
      const complete = isComplete(board);
      return {
        ...state, board, conflicts: findConflicts(board),
        history: pushHistory(state.history, state.board),
        status: complete ? 'complete' : 'idle',
        message: complete ? '🎉 Puzzle complete!' : '',
      };
    }
    case 'SELECT_CELL':
      return state.selected === action.index ? state : { ...state, selected: action.index };
    case 'RESET_BOARD': {
      const board = state.givens.slice();
      return { ...state, board, conflicts: findConflicts(board), history: [], status: 'idle', stats: null, message: 'Board reset to the original puzzle.' };
    }
    case 'NEW_GAME':
      return makeState(action.puzzle.slice(), action.puzzle, 'New puzzle generated.');
    case 'UNDO': {
      if (state.history.length === 0 || state.status === 'solving') return state;
      const board = state.history[state.history.length - 1];
      return { ...state, board, conflicts: findConflicts(board), history: state.history.slice(0, -1), status: 'idle', message: '' };
    }
    case 'CHECK': {
      let bad = 0;
      for (let i = 0; i < CELLS; i++) bad += state.conflicts[i];
      if (bad > 0) return { ...state, message: `❌ ${bad} cell(s) conflict with their row, column or box.` };
      if (isComplete(state.board)) return { ...state, status: 'complete', message: '✅ Correct and complete!' };
      return { ...state, message: `✅ No conflicts so far. ${countEmpty(state.board)} cells left. (Check does not prove the board is still solvable.)` };
    }
    case 'SOLVE_START':
      return { ...state, status: 'solving', message: 'Solving…' };
    case 'SOLVE_COMPLETE':
      return {
        ...state, board: action.board, conflicts: findConflicts(action.board),
        history: pushHistory(state.history, state.board), status: 'solved', stats: action.stats,
        message: action.stats.usedGivensOnly
          ? 'Your entries had no solution, so the solution was computed from the original givens.'
          : 'Solved from your current entries.',
      };
    case 'SOLVE_FAIL':
      return { ...state, status: 'failed', message: action.message };
    case 'LOAD_STATE':
      return makeState(action.board, action.givens, 'Loaded saved game.');
    default:
      return state;
  }
}

function runSolver(board: Board, ref: { current: Worker | null }): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('../workers/sudokuWorker.ts', import.meta.url), { type: 'module' });
    ref.current = w;
    w.onmessage = (e: MessageEvent<WorkerResponse>) => { w.terminate(); ref.current = null; resolve(e.data); };
    w.onerror = (e) => { w.terminate(); ref.current = null; reject(new Error(e.message)); };
    const copy = board.slice(); // keep our board attached; transfer the copy's buffer (zero-copy)
    w.postMessage(copy, [copy.buffer]);
  });
}

export function useSudoku() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const stateRef = useRef(state);
  stateRef.current = state;
  const workerRef = useRef<Worker | null>(null);

  // Autosave on every board change.
  useEffect(() => { writeSaved(AUTOSAVE_KEY, state.board, state.givens); }, [state.board, state.givens]);
  useEffect(() => () => workerRef.current?.terminate(), []);

  const setCell = useCallback((index: number, value: number) => dispatch({ type: 'SET_CELL', index, value }), []);
  const selectCell = useCallback((index: number) => dispatch({ type: 'SELECT_CELL', index }), []);
  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME', puzzle: generatePuzzle(0.45).puzzle }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET_BOARD' }), []);
  const check = useCallback(() => dispatch({ type: 'CHECK' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);

  const solve = useCallback(async () => {
    if (stateRef.current.status === 'solving') return;
    dispatch({ type: 'SOLVE_START' });
    try {
      let r = await runSolver(stateRef.current.board, workerRef);
      let usedGivensOnly = false;
      let nodes = r.nodes, ms = r.ms;
      if (!r.solved) {
        r = await runSolver(stateRef.current.givens, workerRef);
        usedGivensOnly = true;
        nodes += r.nodes; ms += r.ms;
      }
      if (r.solved) dispatch({ type: 'SOLVE_COMPLETE', board: r.board, stats: { nodes, ms, usedGivensOnly } });
      else dispatch({ type: 'SOLVE_FAIL', message: r.aborted ? 'Search limit reached without an answer.' : 'This puzzle has no solution.' });
    } catch (err) {
      dispatch({ type: 'SOLVE_FAIL', message: `Solver error: ${(err as Error).message}` });
    }
  }, []);

  const saveSlot = useCallback(() => {
    const s = stateRef.current;
    const ok = writeSaved(SLOT_KEY, s.board, s.givens);
    dispatch({ type: 'SOLVE_FAIL', message: ok ? '💾 Saved to slot.' : 'Could not save (storage unavailable).' });
  }, []);

  const loadSlot = useCallback(() => {
    const saved = readSaved(SLOT_KEY);
    if (saved) dispatch({ type: 'LOAD_STATE', board: saved.board, givens: saved.givens });
    else dispatch({ type: 'SOLVE_FAIL', message: 'No saved slot found.' });
  }, []);

  return { state, setCell, selectCell, newGame, reset, check, solve, undo, saveSlot, loadSlot };
}
