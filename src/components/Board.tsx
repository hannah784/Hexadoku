import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { CELLS, SIDE, type Board as BoardData } from '../types';
import { charToValue } from '../utils/sudokuLogic';
import { Cell } from './Cell';
import styles from '../styles/App.module.css';

interface BoardProps {
  board: BoardData;
  givens: BoardData;
  conflicts: Uint8Array;
  selected: number;
  onSetCell: (index: number, value: number) => void;
  onSelect: (index: number) => void;
}

const getIdx = (el: EventTarget): number | null => {
  const raw = (el as HTMLElement).dataset?.idx;
  return raw === undefined ? null : Number(raw);
};

export function Board({ board, givens, conflicts, selected, onSetCell, onSelect }: BoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shake, setShake] = useState({ index: -1, n: 0 });

  const focusCell = useCallback((i: number) => {
    const el = ref.current?.querySelector<HTMLInputElement>(`[data-idx="${i}"]`);
    el?.focus();
    el?.select();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLDivElement>) => {
    const i = getIdx(e.target);
    if (i === null) return;
    const raw = (e.target as HTMLInputElement).value;
    if (raw === '') { onSetCell(i, 0); return; }
    const v = charToValue(raw[raw.length - 1]);
    if (v === -1) setShake((s) => ({ index: i, n: s.n + 1 })); // invalid char feedback
    else onSetCell(i, v);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = getIdx(e.target);
    if (i === null) return;
    const r = Math.floor(i / SIDE), c = i % SIDE;
    let next = -1;
    switch (e.key) {
      case 'ArrowUp': next = r > 0 ? i - SIDE : i; break;
      case 'ArrowDown': next = r < SIDE - 1 ? i + SIDE : i; break;
      case 'ArrowLeft': next = c > 0 ? i - 1 : i; break;
      case 'ArrowRight': next = c < SIDE - 1 ? i + 1 : i; break;
      case 'Delete': onSetCell(i, 0); return;
      default: return;
    }
    e.preventDefault();
    focusCell(next);
  };

  const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
    const i = getIdx(e.target);
    if (i !== null) onSelect(i);
  };

  const cells = [];
  for (let i = 0; i < CELLS; i++) {
    cells.push(
      <Cell
        key={i}
        index={i}
        value={board[i]}
        fixed={givens[i] !== 0}
        conflict={conflicts[i] === 1}
        selected={selected === i}
        shake={shake.index === i ? shake.n : 0}
      />,
    );
  }

  return (
    <div
      ref={ref}
      className={styles.board}
      role="group"
      aria-label="16 by 16 Hexadoku board. Use arrow keys to move; type 0-9 or A-F."
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {cells}
    </div>
  );
}
