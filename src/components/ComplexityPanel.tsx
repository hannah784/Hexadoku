import type { SolveStats } from '../types';
import { popcount } from '../utils/sudokuLogic';
import { ALGORITHMS } from '../utils/complexityData';
import styles from '../styles/App.module.css';
interface Props { emptyCount: number; candidates: Uint16Array; stats: SolveStats | null; checks: number }
export function ComplexityPanel({ emptyCount, candidates, stats, checks }: Props) {
  const log = emptyCount * Math.log10(16), exponent = Math.floor(log), mantissa = 10 ** (log - exponent);
  let singles = 0, total = 0;
  candidates.forEach(mask => { const count = popcount(mask); total += count; if (count === 1) singles++; });
  const rows = [
    ['Empty cells, k', emptyCount, ''],
    ['Brute-force worst case, 16^k', `${mantissa.toFixed(2)} × 10^${exponent}`, 'Candidate fillings if every digit were tried in every empty cell.'],
    ['Cells with one candidate', singles, 'The solver fills these without branching.'],
    ['Average candidates per empty cell', emptyCount ? (total / emptyCount).toFixed(1) : '0.0', ''],
    ['Last solve', stats ? `${stats.nodes.toLocaleString()} nodes · ${stats.ms.toFixed(1)} ms` : 'Not run', 'Press Solve to count the nodes the solver actually visits.'],
  ];
  return <section className={styles.complexity} aria-label="Complexity analysis">
    <div><h2>Complexity analysis</h2><p className={styles.hint}>Live numbers for this board.</p>
      <dl className={styles.statistics}>{rows.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd>{note && <small>{note}</small>}</div>)}</dl>
      <p className={styles.definition}>n = grid side length (16); k = currently empty cells. Bounds assume a 16-bit mask fits one machine word. Generalized larger grids require additional words.</p>
    </div>
    <div><h3>Algorithms used on this page</h3>{ALGORITHMS.map(a => <details key={a.name} className={styles.algo} open={a.name === 'Conflict check' || a.name === 'Placement test'}>
      <summary><strong>{a.name}</strong><span>{a.time} · {a.space}</span></summary><p>{a.notes}</p>
      {a.name.startsWith('Puzzle generation') && <p>This puzzle used {checks} uniqueness checks.</p>}
    </details>)}</div>
  </section>;
}
