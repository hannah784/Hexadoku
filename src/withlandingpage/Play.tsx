import { useMemo } from 'react';
import { Board } from '../components/Board';
import { ControlPanel } from '../components/ControlPanel';
import { ComplexityPanel } from '../components/ComplexityPanel';
import { useSudoku } from '../hooks/useSudoku';
import { countEmpty } from '../utils/sudokuLogic';
import styles from '../styles/App.module.css';

/** The original game screen, moved out of App.tsx unchanged. */
export default function Play() {
  const { state, setCell, selectCell, newGame, reset, check, solve, undo, saveSlot, loadSlot } = useSudoku();
  const empties = useMemo(() => countEmpty(state.board), [state.board]);

  return (
    <>
      <h1>Hexadoku 16×16</h1>
      <p className={styles.hint}>
        Allowed characters: <b>0–9</b> and <b>A–F</b> (case-insensitive). Each row, column and 4×4 box must contain all 16 symbols once.
        Move with the arrow keys; <kbd>Delete</kbd>/<kbd>Backspace</kbd> clears a cell.
      </p>
      <div className={styles.layout}>
        <div className={styles.main}>
          <ControlPanel
            status={state.status}
            message={state.message}
            canUndo={state.history.length > 0}
            onNew={newGame} onCheck={check} onSolve={solve}
            onReset={reset} onUndo={undo} onSave={saveSlot} onLoad={loadSlot}
          />
          <Board
            board={state.board}
            givens={state.givens}
            conflicts={state.conflicts}
            selected={state.selected}
            onSetCell={setCell}
            onSelect={selectCell}
          />
        </div>
        <ComplexityPanel emptyCount={empties} stats={state.stats} />
      </div>
    </>
  );
}
