import { useMemo, useState } from 'react';
import { Board } from '../components/Board';
import { ControlPanel } from '../components/ControlPanel';
import { ComplexityPanel } from '../components/ComplexityPanel';
import { useSudoku } from '../hooks/useSudoku';
import { candidateMasks, countEmpty, findConflicts } from '../utils/sudokuLogic';
import { type Difficulty } from '../types';
import styles from '../styles/App.module.css';
export default function Play() {
  const { state, dispatch, setCell, selectCell, newGame, solve, cancel, hint } = useSudoku();
  const [difficulty, setDifficulty] = useState<Difficulty>(state.difficulty);
  const [pending, setPending] = useState('');
  const empty = useMemo(() => countEmpty(state.board), [state.board]);
  const candidates = useMemo(() => candidateMasks(state.board), [state.board]);
  const conflicts = useMemo(() => {
    const c = state.markRepeated || state.checked ? findConflicts(state.board) : new Uint8Array(256);
    if (state.checked) state.board.forEach((v, i) => { if (v && v !== state.solution[i]) c[i] = 1; });
    return c;
  }, [state.board, state.solution, state.markRepeated, state.checked]);
  const busy = state.status === 'solving' || state.status === 'generating';
  const action = (name: string) => {
    const progress = state.moves > 0 || state.board.some((v, i) => v !== state.givens[i]);
    if ((name === 'New puzzle' && progress) || name === 'Solve' || name === 'Reset') {
      if (pending !== name) { setPending(name); return; }
    }
    setPending('');
    switch (name) {
      case 'New puzzle': void newGame(difficulty); break;
      case 'Solve': void solve(); break;
      case 'Cancel': if (state.status === 'solving') cancel(); break;
      case 'markRepeated': dispatch({ type: 'TOGGLE', key: name }); break;
      case 'Erase': dispatch({ type: 'ERASE' }); break;
      case 'Undo': dispatch({ type: 'UNDO' }); break;
      case 'Redo': dispatch({ type: 'REDO' }); break;
      case 'Reset': dispatch({ type: 'RESET' }); break;
      case 'Check': dispatch({ type: 'CHECK' }); break;
      case 'Hint': hint(); break;
    }
  };
  const enter = (index: number, value: number) => { setPending(''); setCell(index, value); };
  return <>
    <div className={styles.playHeader}>
      <div><h1>Hexadoku 16×16</h1><p className={styles.hint}>Fill every row, column and 4×4 box with 0–9 and A–F, each used once.</p></div>
      <div className={styles.puzzleActions}>
        <div className={styles.difficulties} role="group" aria-label="Difficulty for next puzzle">
          {(['Easy', 'Medium', 'Hard'] as const).map(d => <button key={d} aria-pressed={difficulty === d} disabled={busy}
            onClick={() => { setPending(''); setDifficulty(d); }}>{d}</button>)}
        </div>
        <button className={styles.primary} onClick={() => action('New puzzle')} disabled={state.status === 'generating'}>
          {state.status === 'generating' ? 'Generating…' : pending === 'New puzzle' ? 'Confirm new puzzle' : 'New puzzle'}</button>
        {pending === 'New puzzle' && <button onClick={() => setPending('')}>Cancel</button>}
      </div>
    </div>
    <p className={styles.puzzleInfo}>Current puzzle: <b>{state.difficulty}</b><span><b>{256 - countEmpty(state.givens)}</b> givens</span><span>{state.unique ? 'One solution' : state.status === 'generating' ? 'Generating…' : 'Older puzzle · uniqueness unverified'}</span></p>
    <details className={styles.keyboard}><summary onClick={() => setPending('')}>Keyboard controls</summary><p>Arrow keys move. 0–9 and A–F enter a symbol. Backspace or Delete erases.</p></details>
    <div className={styles.layout}>
      <Board board={state.board} givens={state.givens} conflicts={conflicts} selected={state.selected} disabled={busy}
        onSetCell={enter} onSelect={i => { setPending(''); selectCell(i); }} onErase={() => action('Erase')} />
      <ControlPanel state={state} filled={256 - empty} pending={pending} onAction={action} onSymbol={v => enter(state.selected, v)} />
    </div>
    <ComplexityPanel emptyCount={empty} candidates={candidates} stats={state.stats} checks={state.checks} />
  </>;
}
