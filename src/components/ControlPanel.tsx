import type { GameState } from '../types';
import { valueToChar } from '../utils/sudokuLogic';
import styles from '../styles/App.module.css';
interface Props {
  state: GameState; filled: number; pending: string;
  onAction: (action: string) => void;
  onSymbol: (value: number) => void;
}
export function ControlPanel({ state: s, filled, pending, onAction, onSymbol }: Props) {
  const busy = s.status === 'solving' || s.status === 'generating';
  const counts = new Uint16Array(17); s.board.forEach(v => counts[v]++);
  const time = `${Math.floor(s.seconds / 60).toString().padStart(2, '0')}:${(s.seconds % 60).toString().padStart(2, '0')}`;
  return <aside className={styles.controls} aria-label="Gameplay controls">
    <div className={styles.metrics}>
      {[['Time', time], ['Moves', s.moves], ['Hints', s.hints], ['Filled', filled]].map(([label, value]) =>
        <div key={label}><span>{label}</span><strong>{value}</strong>{label === 'Filled' && <small>of 256</small>}</div>)}
    </div>
    <progress value={filled} max={256} aria-label="Filled cells" />
    <div className={styles.keypad} aria-label="Symbol keypad">{Array.from({ length: 16 }, (_, i) => {
      const v = i + 1, remaining = Math.max(0, 16 - counts[v]);
      return <button key={v} onClick={() => onSymbol(v)}
        disabled={busy || !!s.givens[s.selected] || (counts[v] >= 16 && s.board[s.selected] !== v)}
        aria-label={`Enter ${valueToChar(v)}, ${remaining} of 16 remaining`}>
        {valueToChar(v)}<small aria-hidden="true">{remaining}</small></button>;
    })}</div>
    <div className={styles.tools}>{['Erase', 'Undo', 'Redo', 'Hint'].map(label =>
      <button key={label} onClick={() => onAction(label)} disabled={busy || (label === 'Undo' && !s.history.length) || (label === 'Redo' && !s.future.length)}>{label}</button>)}</div>
    <div className={styles.buttons}>{['Check', 'Solve', 'Reset'].map(label =>
      <button key={label} onClick={() => onAction(label)} disabled={busy}>
        {pending === label ? `Confirm ${label.toLowerCase()}` : label}</button>)}
    </div>
    {(pending || s.status === 'solving') && <button className={styles.cancel} onClick={() => onAction('Cancel')}>Cancel{s.status === 'solving' ? ' solve' : ''}</button>}
    <label><input type="checkbox" checked={s.markRepeated} onChange={() => onAction('markRepeated')} />Mark repeated symbols as I type.</label>
    <p className={styles.message} role="status" aria-live="polite">{s.message}</p>
  </aside>;
}
