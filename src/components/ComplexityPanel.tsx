import type { SolveStats } from '../types';
import { SIDE } from '../types';
import { ALGORITHMS, NP_SECTIONS, VARIABLES } from '../utils/complexityData';
import styles from '../styles/App.module.css';

interface Props {
  emptyCount: number;
  stats: SolveStats | null;
}

export function ComplexityPanel({ emptyCount, stats }: Props) {
  const exp = (emptyCount * Math.log10(SIDE)).toFixed(1);
  return (
    <aside className={styles.panel} aria-label="Complexity analysis">
      <h2>Complexity analysis</h2>

      <h3>Live numbers for this board</h3>
      <ul>
        <li>Empty cells k = <b>{emptyCount}</b></li>
        <li>Brute-force worst case: 16^{emptyCount} ≈ <b>10^{exp}</b> candidate fillings</li>
        <li>
          {stats
            ? <>Last solve (MRV + bitmasks): <b>{stats.nodes.toLocaleString()}</b> search nodes in <b>{stats.ms.toFixed(1)} ms</b></>
            : 'Press Solve to see how many nodes the MRV solver actually visits.'}
        </li>
      </ul>

      <h3>Algorithms in <code>sudokuLogic.ts</code></h3>
      {ALGORITHMS.map((a) => (
        <div key={a.name} className={styles.algo}>
          <strong>{a.name}</strong>
          <div>Time: <code>{a.time}</code> · Space: <code>{a.space}</code></div>
          <small>{a.notes}</small>
        </div>
      ))}

      <h3>Variables (16×16 context)</h3>
      <dl>
        {VARIABLES.map(([k, v]) => (<div key={k}><dt><code>{k}</code></dt><dd>{v}</dd></div>))}
      </dl>

      <h3>P vs NP</h3>
      {NP_SECTIONS.map((s) => (<section key={s.title}><h4>{s.title}</h4><p>{s.body}</p></section>))}
    </aside>
  );
}
