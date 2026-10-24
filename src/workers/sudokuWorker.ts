import { solve } from '../utils/sudokuLogic';
import type { WorkerResponse } from '../types';

const MAX_NODES = 1_000_000;
const ctx = self as unknown as Worker;

// The main thread TRANSFERS the buffer (zero-copy); we solve in place and transfer it back.
ctx.onmessage = (e: MessageEvent<Uint8Array>) => {
  const board = e.data;
  const t0 = performance.now();
  const r = solve(board, { maxNodes: MAX_NODES });
  const msg: WorkerResponse = {
    solved: r.solved,
    aborted: r.aborted,
    nodes: r.nodes,
    ms: performance.now() - t0,
    board,
  };
  ctx.postMessage(msg, [board.buffer]);
};
