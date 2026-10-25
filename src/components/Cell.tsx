import { memo } from 'react';
import { BOX_SIDE, SIDE } from '../types';
import { COL, ROW, valueToChar } from '../utils/sudokuLogic';
import styles from '../styles/App.module.css';
export interface CellProps {
  index: number; value: number; fixed: boolean; conflict: boolean; selected: boolean;
  related: boolean; same: boolean; mask: number; shake: number; disabled: boolean;
}
const noop = () => undefined;
function CellImpl(p: CellProps) {
  const r = ROW[p.index], c = COL[p.index];
  const cls = [styles.cell, p.fixed && styles.fixed, p.related && styles.related, p.same && styles.same,
    p.conflict && styles.invalid, p.selected && styles.selected,
    c % BOX_SIDE === BOX_SIDE - 1 && c !== SIDE - 1 && styles.rightEdge,
    r % BOX_SIDE === BOX_SIDE - 1 && r !== SIDE - 1 && styles.bottomEdge,
    p.shake && (p.shake % 2 ? styles.shakeA : styles.shakeB)].filter(Boolean).join(' ');
  return <div className={cls}>
    <input data-idx={p.index} value={valueToChar(p.value)} readOnly={p.fixed || p.disabled} onChange={noop}
      tabIndex={p.selected ? 0 : -1} inputMode="text" autoComplete="off" spellCheck={false}
      aria-label={`Row ${r + 1}, column ${c + 1}${p.fixed ? ', given' : ''}${p.mask && !p.value ? ', notes ' + Array.from({ length: SIDE }, (_, v) => p.mask & (1 << v) ? valueToChar(v + 1) : '').join('') : ''}`}
      aria-invalid={p.conflict} />
    {!p.value && p.mask !== 0 && <span className={styles.candidates} aria-hidden="true">{Array.from({ length: SIDE }, (_, v) => <span key={v}>{p.mask & (1 << v) ? valueToChar(v + 1) : ''}</span>)}</span>}
  </div>;
}
export const areEqual = (a: CellProps, b: CellProps) => Object.keys(a).every(key => a[key as keyof CellProps] === b[key as keyof CellProps]);
export const Cell = memo(CellImpl, areEqual);
