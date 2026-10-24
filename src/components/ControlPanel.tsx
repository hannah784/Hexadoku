import type { GameStatus } from '../types';
import styles from '../styles/App.module.css';

interface Props {
  status: GameStatus;
  message: string;
  canUndo: boolean;
  onNew: () => void;
  onCheck: () => void;
  onSolve: () => void;
  onReset: () => void;
  onUndo: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export function ControlPanel(p: Props) {
  const solving = p.status === 'solving';
  return (
    <div className={styles.controls}>
      <div className={styles.buttons}>
        <button onClick={p.onNew} disabled={solving}>New puzzle</button>
        <button onClick={p.onCheck} disabled={solving}>Check</button>
        <button onClick={p.onSolve} disabled={solving} className={styles.primary}>
          {solving ? '⏳ Solving…' : 'Solve'}
        </button>
        <button onClick={p.onUndo} disabled={solving || !p.canUndo}>Undo</button>
        <button onClick={p.onReset} disabled={solving}>Reset</button>
        <button onClick={p.onSave} disabled={solving}>Save</button>
        <button onClick={p.onLoad} disabled={solving}>Load</button>
      </div>
      <p className={styles.message} role="status" aria-live="polite">{p.message || '\u00A0'}</p>
    </div>
  );
}
