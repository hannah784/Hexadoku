import { CELLS, SIDE, BOX_SIDE, type Board } from '../types';

// ---------- Index helpers (precomputed lookup tables, O(1)) ----------
export const idx = (row: number, col: number): number => row * SIDE + col;
export const ROW = new Uint8Array(CELLS);
export const COL = new Uint8Array(CELLS);
export const BOX = new Uint8Array(CELLS);
for (let i = 0; i < CELLS; i++) {
  ROW[i] = Math.floor(i / SIDE);
  COL[i] = i % SIDE;
  BOX[i] = Math.floor(ROW[i] / BOX_SIDE) * BOX_SIDE + Math.floor(COL[i] / BOX_SIDE);
}

const FULL = 0xffff;

// ---------- Character mapping: stored 1..16 <-> '0'..'F' ----------
export const valueToChar = (v: number): string => (v === 0 ? '' : (v - 1).toString(16).toUpperCase());

/** Returns 1..16 for a valid hex char, or -1 if the character is not allowed. */
export function charToValue(ch: string): number {
  if (!/^[0-9a-fA-F]$/.test(ch)) return -1;
  return parseInt(ch, 16) + 1;
}

function popcount(x: number): number {
  x = x - ((x >> 1) & 0x5555);
  x = (x & 0x3333) + ((x >> 2) & 0x3333);
  x = (x + (x >> 4)) & 0x0f0f;
  return (x + (x >> 8)) & 0x1f;
}

export function countEmpty(board: Board): number {
  let n = 0;
  for (let i = 0; i < CELLS; i++) if (board[i] === 0) n++;
  return n;
}

// ---------- Validation: O(n^2) time, O(n^2) space ----------
/** Flags every cell that duplicates a value in its row, column or 4x4 box. */
export function findConflicts(board: Board): Uint8Array {
  const rc = new Uint8Array(CELLS);
  const cc = new Uint8Array(CELLS);
  const bc = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (v === 0) continue;
    const k = v - 1;
    rc[ROW[i] * SIDE + k]++;
    cc[COL[i] * SIDE + k]++;
    bc[BOX[i] * SIDE + k]++;
  }
  const out = new Uint8Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (v === 0) continue;
    const k = v - 1;
    if (rc[ROW[i] * SIDE + k] > 1 || cc[COL[i] * SIDE + k] > 1 || bc[BOX[i] * SIDE + k] > 1) out[i] = 1;
  }
  return out;
}

export function isValid(board: Board): boolean {
  const c = findConflicts(board);
  for (let i = 0; i < CELLS; i++) if (c[i]) return false;
  return true;
}

export function isComplete(board: Board): boolean {
  for (let i = 0; i < CELLS; i++) if (board[i] === 0) return false;
  return isValid(board);
}

// ---------- Solver: MRV backtracking + bitmask constraint propagation ----------
export interface SolveOptions {
  maxNodes?: number;
}
export interface SolveResult {
  solved: boolean;
  aborted: boolean;
  nodes: number;
}

/**
 * Solves `board` IN PLACE. Uses three Uint16 bitmasks (rows/cols/boxes);
 * candidate set for a cell = ~(row|col|box) & 0xFFFF, computed in O(1).
 * Always branches on the empty cell with the Minimum Remaining Values;
 * cells with exactly one candidate (naked singles) are forced first.
 */
export function solve(board: Board, opts: SolveOptions = {}): SolveResult {
  const maxNodes = opts.maxNodes ?? Number.POSITIVE_INFINITY;
  const rows = new Uint16Array(SIDE);
  const cols = new Uint16Array(SIDE);
  const boxes = new Uint16Array(SIDE);
  const empties = new Uint8Array(CELLS);
  let n = 0;

  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (v === 0) {
      empties[n++] = i;
      continue;
    }
    const bit = 1 << (v - 1);
    if ((rows[ROW[i]] & bit) !== 0 || (cols[COL[i]] & bit) !== 0 || (boxes[BOX[i]] & bit) !== 0) {
      return { solved: false, aborted: false, nodes: 0 }; // givens already contradict
    }
    rows[ROW[i]] |= bit;
    cols[COL[i]] |= bit;
    boxes[BOX[i]] |= bit;
  }

  let nodes = 0;
  let aborted = false;

  const search = (remaining: number): boolean => {
    if (remaining === 0) return true;
    if (++nodes > maxNodes) {
      aborted = true;
      return false;
    }
    let best = -1;
    let bestMask = 0;
    let bestCount = SIDE + 1;
    for (let k = 0; k < remaining; k++) {
      const i = empties[k];
      const m = ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & FULL;
      const cnt = popcount(m);
      if (cnt < bestCount) {
        bestCount = cnt;
        best = k;
        bestMask = m;
        if (cnt <= 1) break;
      }
    }
    if (bestCount === 0) return false;

    const cell = empties[best];
    empties[best] = empties[remaining - 1];
    empties[remaining - 1] = cell;
    const r = ROW[cell], c = COL[cell], b = BOX[cell];

    let m = bestMask;
    while (m !== 0) {
      const bit = m & -m;
      m ^= bit;
      rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      board[cell] = 32 - Math.clz32(bit); // bit index + 1
      if (search(remaining - 1)) return true;
      rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
      if (aborted) break;
    }
    board[cell] = 0;
    return false;
  };

  const solved = search(n);
  return { solved, aborted, nodes };
}

// ---------- Generation ----------
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffledAxis(): number[] {
  const bands = shuffle([0, 1, 2, 3]);
  return bands.flatMap((b) => shuffle([0, 1, 2, 3]).map((x) => b * BOX_SIDE + x));
}

/**
 * Builds a random valid full grid from the canonical pattern
 * (4*(r%4) + floor(r/4) + c) mod 16, then applies validity-preserving
 * shuffles (digits, rows within bands, bands, columns within stacks, stacks).
 * Then removes cells until `fillRatio` (>= 0.40) remain as givens.
 * The puzzle is solvable by construction (uniqueness is not enforced).
 */
export function generatePuzzle(fillRatio = 0.45): { puzzle: Board; solution: Board } {
  const ratio = Math.max(0.4, Math.min(1, fillRatio));
  const rowOrder = shuffledAxis();
  const colOrder = shuffledAxis();
  const digits = shuffle(Array.from({ length: SIDE }, (_, i) => i));
  const solution = new Uint8Array(CELLS);
  for (let r = 0; r < SIDE; r++) {
    for (let c = 0; c < SIDE; c++) {
      const br = rowOrder[r], bc = colOrder[c];
      const pattern = (BOX_SIDE * (br % BOX_SIDE) + Math.floor(br / BOX_SIDE) + bc) % SIDE;
      solution[idx(r, c)] = digits[pattern] + 1;
    }
  }
  const keep = Math.ceil(CELLS * ratio);
  const order = shuffle(Array.from({ length: CELLS }, (_, i) => i));
  const puzzle = new Uint8Array(CELLS);
  for (let k = 0; k < keep; k++) puzzle[order[k]] = solution[order[k]];
  return { puzzle, solution };
}
