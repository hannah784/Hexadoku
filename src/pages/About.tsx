import styles from '../styles/Pages.module.css';

const KEYS: ReadonlyArray<[string, string]> = [
  ['0–9, A–F', 'Enter a symbol (case-insensitive)'],
  ['Arrow keys', 'Move between cells'],
  ['Delete', 'Clear the cell'],
];

const BUILT_WITH: ReadonlyArray<[string, string]> = [
  ['Solver', 'Backtracking that always picks the cell with the fewest candidates, using 16-bit masks for constant-time checks.'],
  ['Background thread', 'The solver runs in a Web Worker. The board is handed over as a transferable buffer, with no copying.'],
  ['Board storage', 'A flat 256-byte array instead of nested objects, which keeps memory small and garbage collection quiet.'],
  ['Rendering', 'Each cell re-renders only when its own value or state changes, so a keystroke touches one cell, not 256.'],
  ['State', 'A single reducer holds the board, undo history (200 steps), status and solver stats.'],
  ['Persistence', 'The board autosaves to localStorage. A separate slot is available through Save and Load.'],
];

export default function About() {
  return (
    <article className={styles.prose}>
      <h1>About</h1>
      <p className={styles.lead}>
        Hexadoku is the 16×16 cousin of Sudoku. It is also a small teaching tool: it shows how a solver works and why
        puzzles like this are hard for computers in general.
      </p>

      <h2>The rules</h2>
      <p>
        The grid has 256 cells split into sixteen 4×4 boxes. Each row, column and box must contain every symbol from
        0 to F exactly once. Cells in grey are givens and cannot be changed. A cell turns red when it repeats a symbol
        in its row, column or box.
      </p>

      <h2>Controls</h2>
      <dl className={styles.keys}>
        {KEYS.map(([k, v]) => (
          <div key={k}><dt><kbd>{k}</kbd></dt><dd>{v}</dd></div>
        ))}
      </dl>
      <p>
        <b>Check</b> reports conflicts, <b>Undo</b> steps back, <b>Reset</b> returns to the original puzzle and{' '}
        <b>Solve</b> fills in an answer. If your entries have no solution, Solve falls back to the original givens.
      </p>

      <h2>New puzzles</h2>
      <p>
        Each puzzle starts from a valid full grid that is shuffled at random, then 45% of its cells are kept as givens.
        A solution always exists, but it is not guaranteed to be the only one.
      </p>

      <h2>Under the hood</h2>
      <dl className={styles.specs}>
        {BUILT_WITH.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>

      <h2>Why it is hard</h2>
      <p>
        Solving Sudoku on a general n×n grid is NP-complete: a finished grid is quick to check, but no known method
        finds one quickly for every puzzle. The Play page has the full explanation, with live numbers from your board.
      </p>

      <div className={styles.actions}>
        <a href="#/play" className={`${styles.btn} ${styles.btnPrimary}`}>Start playing</a>
      </div>
    </article>
  );
}
