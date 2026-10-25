import styles from '../styles/Pages.module.css';
const CONTROLS = [
  ['Keypad or keys', 'Enter a symbol with the on-screen keypad or 0–9, A–F. Arrow keys move between cells; Backspace or Delete erases.'],
  ['Erase', 'Clears the selected editable cell.'],
  ['Hint', 'Reveals one correct cell and counts toward your hint total. The timer continues while you play.'],
  ['Check', 'Marks repeated symbols and entries that differ from the unique solution. Errors have a hatch pattern and a corner flag.'],
  ['Solve', 'Click twice to fill in the answer. A Web Worker solves your entries, falling back to the original givens if needed. Cancel stops the worker.'],
  ['Reset, Undo, Redo', 'Reset requires a second click and returns to the original puzzle. Undo and Redo step through your entries. Moves and hints count actions already taken.'],
];
const BUILT_WITH = [
  ['Solver', 'Backtracking that picks the cell with the fewest candidates, using 16-bit masks for constant-time checks.'],
  ['Background thread', 'Solving and puzzle generation run in Web Workers. Copies of the flat board are sent as transferable buffers.'],
  ['Board storage', 'A flat 256-byte array keeps memory small.'],
  ['Rendering', 'Memoized cells update when their value, highlighting or other visible state changes.'],
  ['State', 'A single reducer holds the board, undo/redo history (200 steps), timer and solver statistics.'],
  ['Persistence', 'The game saves automatically to localStorage, including progress, difficulty, timer and move history.'],
];
export default function About() {
  return <article className={styles.prose}><h1>About</h1>
    <p className={styles.lead}>Hexadoku is the 16×16 cousin of Sudoku. It is also a small teaching tool: it shows how a solver works and why puzzles like this are hard for computers in general.</p>
    <h2>The rules</h2><p>The grid has 256 cells split into sixteen 4×4 boxes. Each row, column and box must contain every symbol from 0 to F exactly once. Grey cells are givens and cannot be changed. Repeated symbols are marked in red, with a hatch pattern and a corner flag.</p>
    <h2>Controls</h2><dl className={styles.keys}>{CONTROLS.map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    <h2>New puzzles</h2><p>Each puzzle starts from a valid full grid that is shuffled at random. Cells are removed one by one, and a removal is kept only if exactly one solution remains. Easy targets 154 givens, Medium 115 and Hard 96. Uniqueness takes priority: a puzzle can retain more clues when further checks reach the search budget. Changing difficulty selects your next puzzle. New puzzle requires a second click when you have progress to lose.</p>
    <h2>Under the hood</h2><dl className={styles.specs}>{BUILT_WITH.map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    <h2>Why it is hard</h2><p>Generalized Sudoku completion is NP-complete: a proposed solution is verifiable in polynomial time, but no polynomial-time algorithm is known for all instances. A fixed 16×16 board is finite; asymptotic complexity describes the generalized problem. The Play page shows the algorithms and live numbers for your board.</p>
  </article>;
}
