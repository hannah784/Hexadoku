import { countSolutions, generatePuzzle, solve } from '../utils/sudokuLogic';
import { CELLS, TARGETS, type WorkerRequest, type WorkerResponse } from '../types';
const ctx = self as unknown as Worker;
ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const t0 = performance.now();
  if (e.data.kind === 'generate') {
    const { puzzle, solution, checks } = generatePuzzle(TARGETS[e.data.difficulty] / CELLS);
    const msg: WorkerResponse = { solved: true, aborted: false, nodes: 0, ms: performance.now() - t0, board: puzzle, solution, checks };
    ctx.postMessage(msg, [puzzle.buffer, solution.buffer]);
  } else {
    const board = e.data.board;
    const uniqueness = e.data.kind === 'restore' ? countSolutions(board) : null;
    const result = solve(board, { maxNodes: 1_000_000 });
    ctx.postMessage({ ...result, unique: uniqueness?.count === 1 && !uniqueness.aborted, ms: performance.now() - t0, board } satisfies WorkerResponse, [board.buffer]);
  }
};
