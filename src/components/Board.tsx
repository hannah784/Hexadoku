import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { CELLS, SIDE, type Board as BoardData } from '../types';
import { BOX, COL, ROW, charToValue } from '../utils/sudokuLogic';
import { Cell } from './Cell';
import styles from '../styles/App.module.css';
interface BoardProps {
  board: BoardData; givens: BoardData; conflicts: Uint8Array; selected: number; disabled: boolean;
  onSetCell: (index: number, value: number) => void; onSelect: (index: number) => void; onErase: () => void;
}
const getIdx = (el: EventTarget): number | null => {
  const raw = (el as HTMLElement).dataset?.idx;
  return raw === undefined ? null : Number(raw);
};
export function Board({ board, givens, conflicts, selected, disabled, onSetCell, onSelect, onErase }: BoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shake, setShake] = useState({ index: -1, n: 0 });
  const focusCell = useCallback((i: number) => {
    const el = ref.current?.querySelector<HTMLInputElement>(`[data-idx="${i}"]`); el?.focus(); el?.select();
  }, []);
  const handleChange = (e: ChangeEvent<HTMLDivElement>) => {
    const i = getIdx(e.target); if (i === null) return;
    const raw = (e.target as HTMLInputElement).value;
    if (!raw) { onErase(); return; }
    const v = charToValue(raw[raw.length - 1]);
    if (v === -1) setShake(s => ({ index: i, n: s.n + 1 })); else onSetCell(i, v);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = getIdx(e.target); if (i === null || e.ctrlKey || e.metaKey || e.altKey) return;
    let next = -1;
    switch (e.key) {
      case 'ArrowUp': next = ROW[i] > 0 ? i - SIDE : i; break;
      case 'ArrowDown': next = ROW[i] < SIDE - 1 ? i + SIDE : i; break;
      case 'ArrowLeft': next = COL[i] > 0 ? i - 1 : i; break;
      case 'ArrowRight': next = COL[i] < SIDE - 1 ? i + 1 : i; break;
      case 'Delete': case 'Backspace': e.preventDefault(); onErase(); return;
      default: {
        const value = charToValue(e.key);
        if (value > 0) { e.preventDefault(); onSetCell(i, value); }
        return;
      }
    }
    e.preventDefault(); focusCell(next);
  };
  const handleFocus = (e: FocusEvent<HTMLDivElement>) => { const i = getIdx(e.target); if (i !== null) onSelect(i); };
  return <div ref={ref} className={styles.board} role="group" aria-label="16 by 16 Hexadoku board. Use arrow keys to move; type 0-9 or A-F."
    onChange={handleChange} onKeyDown={handleKeyDown} onFocus={handleFocus}>
    {Array.from({ length: CELLS }, (_, i) => <Cell key={i} index={i} value={board[i]} fixed={givens[i] !== 0}
      conflict={conflicts[i] === 1} selected={selected === i} disabled={disabled}
      related={ROW[i] === ROW[selected] || COL[i] === COL[selected] || BOX[i] === BOX[selected]}
      same={board[selected] !== 0 && board[selected] === board[i]} shake={shake.index === i ? shake.n : 0} />)}
  </div>;
}
