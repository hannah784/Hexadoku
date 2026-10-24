export interface AlgorithmInfo {
  name: string;
  time: string;
  space: string;
  notes: string;
}

export const VARIABLES: ReadonlyArray<[string, string]> = [
  ['n', 'Side length of the grid (n = 16). The board has n² = 256 cells and n = 16 boxes of √n × √n = 4×4.'],
  ['k', 'Number of empty cells at the moment of solving (k ≤ n² = 256).'],
  ['b', 'Branching factor: candidate digits tried at one node. Brute force: b ≤ 16. MRV: effective b is usually 1–3.'],
  ['d', 'Search depth = number of cells still to fill = k.'],
];

export const ALGORITHMS: ReadonlyArray<AlgorithmInfo> = [
  {
    name: 'Validation / completeness check (findConflicts)',
    time: 'O(n²)',
    space: 'O(n²)',
    notes:
      'One pass over the 256 cells updates per-unit digit counters, a second pass flags duplicates. Each cell does O(1) work. The counters take 3·n² bytes.',
  },
  {
    name: 'Placement test in the solver (bitmasks)',
    time: 'O(1) per test',
    space: 'O(n)',
    notes:
      'Candidates = ~(rowMask | colMask | boxMask) & 0xFFFF. Three Uint16Array(16) hold the used digits, so no row, column or box is ever scanned.',
  },
  {
    name: 'Naive brute-force backtracking',
    time: 'O(n^k) = O(16^k)',
    space: 'O(n²)',
    notes: 'Fills cells in fixed order and tries every digit at each, so the worst case is exponential in the number of empty cells.',
  },
  {
    name: 'Implemented solver: MRV + bitmask propagation',
    time: 'O(b^d), b ≪ n; O(k) work per node',
    space: 'O(n²)',
    notes:
      'Each node scans the remaining empties (≤ 256) and branches on the cell with the fewest candidates. Forced moves (1 candidate) have b = 1, and dead ends (0 candidates) are cut immediately. The worst case remains exponential, but the effective branching factor drops sharply. Memory is the board plus O(n) masks plus a recursion stack of depth ≤ k.',
  },
];

export const NP_SECTIONS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Generalized Sudoku',
    body:
      'Fixed sizes such as 9×9 or 16×16 are finite, so as a decision problem they are trivially constant-time. Complexity classes apply to the generalization: given an n×n grid (n = m²) with some cells pre-filled, can it be completed so every row, column and m×m box contains each of 1..n exactly once?',
  },
  {
    title: 'Why it is in NP',
    body:
      'A certificate is a fully filled grid. A verifier checks that it extends the givens and that each of the 3n units holds n distinct symbols. With counters this takes O(n²) time, polynomial in the input size. So a proposed solution is checkable in polynomial time, which is the definition of NP.',
  },
  {
    title: 'Why it is NP-complete',
    body:
      'Yato and Seta (2003) showed that Sudoku completion is NP-complete, using a polynomial-time reduction from Latin Square Completion (the "Quasigroup With Holes" problem), which Colbourn proved NP-complete in 1984. The reduction builds, from any partial Latin square, a partial Sudoku whose box constraints can always be satisfied, so the Sudoku is completable exactly when the Latin square is. Membership in NP together with NP-hardness gives NP-completeness. Their reduction is also parsimonious, so counting solutions is #P-complete.',
  },
  {
    title: 'What this means for the solver',
    body:
      'Unless P = NP, no algorithm solves all n×n instances in time polynomial in n. Heuristics like MRV and constraint propagation improve typical running time, and our node counter shows this, but they cannot change the worst-case exponential bound.',
  },
];
