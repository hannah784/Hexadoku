import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Difficulty, WorkerRequest, WorkerResponse } from '../types';
import { blankState, gameReducer, readSaved, saveGame } from '../utils/gameState';
import { isComplete } from '../utils/sudokuLogic';

export function useSudoku() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => readSaved() ?? blankState());
  const stateRef = useRef(state); stateRef.current = state;
  const task = useRef<{ worker: Worker; reject: (e: Error) => void } | null>(null);
  const version = useRef(0);
  const stop = useCallback(() => {
    version.current++;
    task.current?.worker.terminate(); task.current?.reject(new Error('Cancelled'));
    task.current = null;
  }, []);
  const run = useCallback((request: WorkerRequest): Promise<WorkerResponse> => new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/sudokuWorker.ts', import.meta.url), { type: 'module' });
    task.current = { worker, reject };
    const finish = () => { worker.terminate(); if (task.current?.worker === worker) task.current = null; };
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => { finish(); resolve(e.data); };
    worker.onerror = e => { finish(); reject(new Error(e.message)); };
    worker.onmessageerror = () => { finish(); reject(new Error('Worker response could not be read.')); };
    if (request.kind !== 'generate') {
      const board = request.board.slice(); worker.postMessage({ kind: request.kind, board }, [board.buffer]);
    } else worker.postMessage(request);
  }), []);
  const newGame = useCallback(async (difficulty: Difficulty) => {
    stop(); const id = version.current;
    dispatch({ type: 'BUSY', status: 'generating' });
    try {
      const r = await run({ kind: 'generate', difficulty });
      if (id !== version.current || !r.solution) return;
      dispatch({ type: 'REPLACE', state: { ...blankState(), board: r.board.slice(), givens: r.board, solution: r.solution,
        checks: r.checks ?? 0, unique: true, difficulty, status: 'idle', message: 'New puzzle ready. One solution.' } });
    } catch (e) {
      if (id === version.current) dispatch({ type: 'MESSAGE', message: `Generation failed: ${(e as Error).message}. Try New puzzle again.` });
    }
  }, [run, stop]);
  useEffect(() => {
    const saved = stateRef.current;
    if (!saved.solution.some(Boolean)) {
      if (!saved.givens.some(Boolean)) void newGame('Easy');
      else {
        const id = ++version.current;
        void run({ kind: 'restore', board: saved.givens }).then(r => {
          if (id !== version.current) return;
          if (!r.solved) { dispatch({ type: 'MESSAGE', message: 'The older save could not be restored. Choose New puzzle to start again.' }); return; }
          dispatch({ type: 'REPLACE', state: { ...saved, solution: r.board, unique: r.unique === true,
            status: isComplete(saved.board) ? 'complete' : 'idle', message: 'Restored your previous puzzle.' } });
        }).catch(e => { if (id === version.current) dispatch({ type: 'MESSAGE', message: `Restore failed: ${(e as Error).message}` }); });
      }
    }
    return stop;
  }, [newGame, run, stop]);
  useEffect(() => { saveGame(state); }, [state]);
  useEffect(() => {
    if (state.status !== 'idle') return;
    let last = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now(), seconds = Math.floor((now - last) / 1000);
      if (seconds > 0) { last += seconds * 1000; dispatch({ type: 'TICK', seconds }); }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.status]);
  const cancel = useCallback(() => { stop(); dispatch({ type: 'CANCEL' }); }, [stop]);
  const solve = useCallback(async () => {
    const s = stateRef.current;
    if (task.current || !s.solution.some(Boolean)) return;
    const id = ++version.current;
    dispatch({ type: 'BUSY', status: 'solving' });
    try {
      let r = await run({ kind: 'solve', board: s.board });
      if (id !== version.current) return;
      let nodes = r.nodes, ms = r.ms, usedGivensOnly = false;
      if (!r.solved) {
        r = await run({ kind: 'solve', board: s.givens }); usedGivensOnly = true;
        nodes += r.nodes; ms += r.ms;
      }
      if (id !== version.current) return;
      if (r.solved) dispatch({ type: 'SOLVED', board: r.board, stats: { nodes, ms, usedGivensOnly } });
      else dispatch({ type: 'MESSAGE', message: r.aborted ? 'Search limit reached. You can try again.' : 'No solution found.' });
    } catch (e) {
      if (id === version.current) dispatch({ type: 'MESSAGE', message: `Solver error: ${(e as Error).message}` });
    }
  }, [run]);
  const setCell = useCallback((index: number, value: number) => dispatch({ type: 'EDIT', index, value }), []);
  const selectCell = useCallback((index: number) => dispatch({ type: 'SELECT', index }), []);
  const hint = () => {
    const s = stateRef.current;
    const index = !s.givens[s.selected] && s.board[s.selected] !== s.solution[s.selected] ? s.selected
      : s.board.findIndex((v, i) => !s.givens[i] && v !== s.solution[i]);
    if (index >= 0) { dispatch({ type: 'SELECT', index }); dispatch({ type: 'EDIT', index, value: s.solution[index], hint: true }); }
  };
  return { state, dispatch, setCell, selectCell, newGame, solve, cancel, hint };
}
