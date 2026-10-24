import { memo } from 'react';
import { BOX_SIDE, SIDE } from '../types';
import { COL, ROW, valueToChar } from '../utils/sudokuLogic';
import styles from '../styles/App.module.css';

export interface CellProps {
  index: number;
  value: number;
  fixed: boolean;
  conflict: boolean;
  selected: boolean;
  shake: number; // 0 = none; odd/even alternates between two identical animations so it can replay
}

// Real input changes are handled by the Board via event delegation (bubbling),
// so Cell needs no callback props and memoization stays perfect.
const noop = () => undefined;

function CellImpl({ index, value, fixed, conflict, selected, shake }: CellProps) {
  const r = ROW[index], c = COL[index];
  const cls = [
    styles.cell,
    fixed && styles.fixed,
    conflict && styles.invalid,
    selected && styles.selected,
    c % BOX_SIDE === BOX_SIDE - 1 && c !== SIDE - 1 && styles.rightEdge,
    r % BOX_SIDE === BOX_SIDE - 1 && r !== SIDE - 1 && styles.bottomEdge,
    shake !== 0 && (shake % 2 === 1 ? styles.shakeA : styles.shakeB),
  ].filter(Boolean).join(' ');

  return (
    <input
      className={cls}
      data-idx={index}
      value={valueToChar(value)}
      readOnly={fixed}
      onChange={noop}
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
      aria-label={`Row ${r + 1}, column ${c + 1}${fixed ? ', given' : ''}`}
      aria-invalid={conflict}
    />
  );
}

/** Re-render only if THIS cell's own data changed. */
export const areEqual = (a: CellProps, b: CellProps): boolean =>
  a.index === b.index && a.value === b.value && a.fixed === b.fixed &&
  a.conflict === b.conflict && a.selected === b.selected && a.shake === b.shake;

export const Cell = memo(CellImpl, areEqual);
