import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
const dir = mkdtempSync(join(tmpdir(), 'hexadoku-tests-'));
// Transpile with the project's existing TypeScript compiler; no test dependencies.
function compile(relative, mockReact = false) {
  const file = join(dir, relative.replace(/\.ts$/, '.mjs'));
  mkdirSync(dirname(file), { recursive: true });
  const result = ts.transpileModule(readFileSync(relative, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText.replace(/from '([^']+)'/g, (match, specifier) => {
    if (mockReact && specifier === 'react') return "from '../../react-mock.mjs'";
    if (!specifier.startsWith('.')) return match;
    return `from '${specifier}${specifier.endsWith('/types') ? '/index' : ''}.mjs'`;
  });
  writeFileSync(file, result);
  return file;
}
for (const file of ['src/types/index.ts', 'src/utils/sudokuLogic.ts', 'src/utils/gameState.ts']) compile(file);
const l = Object.assign({},
  await import(pathToFileURL(join(dir, 'src/types/index.mjs'))),
  await import(pathToFileURL(join(dir, 'src/utils/sudokuLogic.mjs'))),
  await import(pathToFileURL(join(dir, 'src/utils/gameState.mjs'))));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
let stored = new Map();
globalThis.localStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
const sample = l.generatePuzzle(154 / 256);
const make = () => ({ ...l.blankState(), board: sample.puzzle.slice(), givens: sample.puzzle.slice(), solution: sample.solution.slice(), unique: true, status: 'idle' });
test('symbol mapping includes 0 and F, rejects other characters', () => {
  assert.equal(l.charToValue('0'), 1); assert.equal(l.charToValue('f'), 16); assert.equal(l.valueToChar(16), 'F'); assert.equal(l.charToValue('G'), -1);
});
for (const [difficulty, target] of Object.entries(l.TARGETS)) test(`${difficulty}: valid solution, certified uniqueness, bounded removal calls`, () => {
  const r = l.generatePuzzle(target / 256);
  assert.ok(l.isComplete(r.solution)); assert.ok(256 - l.countEmpty(r.puzzle) >= target); assert.ok(r.checks <= 256);
  assert.deepEqual(l.countSolutions(r.puzzle, 1_000_000).count, 1);
  assert.equal(l.countSolutions(r.puzzle, 1_000_000).aborted, false);
  const copy = r.puzzle.slice(); assert.ok(l.solve(copy).solved); assert.deepEqual(copy, r.solution);
  assert.ok(r.puzzle.every((v, i) => !v || v === r.solution[i]));
});
test('counting recognizes ambiguity, contradictions and budget exhaustion without mutating input', () => {
  const empty = new Uint8Array(256), original = empty.slice();
  assert.equal(l.countSolutions(empty).count, 2); assert.deepEqual(empty, original);
  assert.equal(l.countSolutions(empty, 0).aborted, true);
  const bad = sample.solution.slice(); bad[0] = bad[1]; assert.equal(l.countSolutions(bad).count, 0); assert.equal(l.isComplete(bad), false);
  assert.equal(l.findConflicts(bad)[0], 1); assert.equal(l.findConflicts(bad)[1], 1);
});
test('candidate masks agree with independent row/column/box placement scans', () => {
  const masks = l.candidateMasks(sample.puzzle);
  for (let i = 0; i < 256; i++) {
    if (sample.puzzle[i]) { assert.equal(masks[i], 0); continue; }
    let expected = 0;
    for (let v = 1; v <= 16; v++) {
      const blocked = sample.puzzle.some((x,j) => x === v && (l.ROW[i] === l.ROW[j] || l.COL[i] === l.COL[j] || l.BOX[i] === l.BOX[j]));
      if (!blocked) expected |= 1 << (v - 1);
    }
    assert.equal(masks[i], expected);
  }
});
test('notes, entries, peer note cleanup, erasure, undo/redo and givens protection', () => {
  let s = make(); const i = s.board.findIndex(v => !v), fixed = s.givens.findIndex(Boolean), value = s.solution[i];
  const before = s; s = l.gameReducer(s, { type: 'EDIT', index: fixed, value: 0 }); assert.equal(s, before);
  s = l.gameReducer(s, { type: 'SELECT', index: i });
  s = l.gameReducer(s, { type: 'TOGGLE', key: 'notesMode' });
  s = l.gameReducer(s, { type: 'EDIT', index: i, value }); assert.equal(s.notes[i], 1 << (value - 1)); assert.equal(s.board[i], 0);
  s = l.gameReducer(s, { type: 'ERASE' }); assert.equal(s.notes[i], 0); assert.equal(s.notesMode, true);
  s = l.gameReducer(s, { type: 'UNDO' }); assert.equal(s.notes[i], 1 << (value - 1));
  s = l.gameReducer(s, { type: 'REDO' }); assert.equal(s.notes[i], 0);
  s = l.gameReducer(s, { type: 'TOGGLE', key: 'notesMode' });
  s = l.gameReducer(s, { type: 'EDIT', index: i, value }); assert.equal(s.board[i], value); assert.equal(s.future.length, 0);
  s = l.gameReducer(s, { type: 'UNDO' }); assert.equal(s.board[i], 0);
  s = l.gameReducer(s, { type: 'REDO' }); assert.equal(s.board[i], value);
  s = l.gameReducer(s, { type: 'RESET' }); assert.deepEqual(s.board, s.givens); assert.equal(s.moves, 0);
});
test('check, hint counters, timer, completion and solver statistics', () => {
  let s = make(); const i = s.board.findIndex(v => !v);
  s = l.gameReducer(s, { type: 'EDIT', index: i, value: s.solution[i] % 16 + 1 });
  s = l.gameReducer(s, { type: 'CHECK' }); assert.match(s.message, /1 incorrect/);
  s = l.gameReducer(s, { type: 'EDIT', index: i, value: s.solution[i], hint: true }); assert.equal(s.hints, 1);
  s = l.gameReducer(s, { type: 'TICK', seconds: 5 }); assert.equal(s.seconds, 5);
  s = l.gameReducer(s, { type: 'BUSY', status: 'solving' });
  assert.equal(l.gameReducer(s, { type: 'EDIT', index: i, value: 0 }), s);
  s = l.gameReducer(s, { type: 'SOLVED', board: s.solution.slice(), stats: { nodes: 20, ms: 1, usedGivensOnly: false } });
  assert.equal(s.status, 'complete'); assert.equal(s.stats.nodes, 20);
  assert.equal(l.gameReducer(s, { type: 'TICK', seconds: 2 }).seconds, 5);
  s = l.gameReducer(s, { type: 'UNDO' }); assert.equal(s.status, 'idle');
});
test('autosave round trip preserves typed arrays, history, notes, difficulty and timer; malformed saves rejected', () => {
  stored = new Map(); let s = make(); const i = s.board.findIndex(v => !v);
  s = l.gameReducer(s, { type: 'SELECT', index: i });
  s = l.gameReducer(s, { type: 'EDIT', index: i, value: s.solution[i] });
  s = { ...s, seconds: 42, hints: 2, difficulty: 'Hard' }; assert.ok(l.saveGame(s));
  const loaded = l.readSaved(); assert.deepEqual(loaded.board, s.board); assert.deepEqual(loaded.history, s.history);
  assert.equal(loaded.seconds, 42); assert.equal(loaded.hints, 2); assert.equal(loaded.difficulty, 'Hard'); assert.ok(l.hasUnfinishedGame());
  stored.set(l.AUTOSAVE_KEY, '{}'); assert.equal(l.readSaved(), null);
  stored.set(l.AUTOSAVE_KEY, '{bad'); assert.equal(l.readSaved(), null);
});
test('older board-only saves remain available for background migration', () => {
  stored = new Map([['hexadoku:autosave:v1', JSON.stringify({ board: Array.from(sample.puzzle), givens: Array.from(sample.puzzle) })]]);
  const old = l.readSaved(); assert.deepEqual(old.board, sample.puzzle); assert.equal(old.status, 'generating'); assert.equal(old.solution.some(Boolean), false);
});

// Exercise the real hook against controlled asynchronous workers and a minimal
// hook scheduler so cancellation races are deterministic, without new dependencies.
writeFileSync(join(dir, 'react-mock.mjs'), `
  export const useCallback = fn => fn;
  export const useRef = value => globalThis.hookHarness.ref(value);
  export const useReducer = (reducer, arg, init) => globalThis.hookHarness.reducer(reducer, arg, init);
  export const useEffect = (effect, deps) => globalThis.hookHarness.effect(effect, deps);
`);
const hookOutput = compile('src/hooks/useSudoku.ts', true);
const { useSudoku } = await import(pathToFileURL(hookOutput));
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function harness() {
  globalThis.window = { setInterval: () => 1, clearInterval: () => {} };
  stored = new Map(); l.saveGame(make());
  const refs = [], effects = []; let cursor = 0, state, reducer;
  globalThis.hookHarness = {
    ref(value) { const i = cursor++; return refs[i] ??= { current: value }; },
    reducer(fn, arg, init) { reducer = fn; state ??= init(arg); return [state, a => { state = reducer(state, a); }]; },
    effect(fn) { effects.push(fn); },
  };
  const workers = [];
  globalThis.Worker = class {
    terminated = false;
    constructor() { workers.push(this); }
    postMessage(request) { this.request = request; }
    terminate() { this.terminated = true; }
    reply(data) { this.onmessage({ data }); }
  };
  const render = () => { cursor = 0; effects.length = 0; return useSudoku(); };
  let hook = render();
  // Run mount effects once, then render manually after dispatches.
  const cleanups = effects.map(fn => fn()).filter(fn => typeof fn === 'function');
  return { render, workers, get state() { return state; }, hook, cleanup() { cleanups.forEach(fn => fn()); } };
}
test('cancel terminates a worker and a late response cannot modify the board', async () => {
  const h = harness(), before = h.state.board.slice();
  const pending = h.hook.solve(); const worker = h.workers[0];
  h.hook.cancel(); assert.equal(worker.terminated, true);
  worker.reply({ solved: true, board: sample.solution, nodes: 1, ms: 1 }); await pending;
  assert.deepEqual(h.state.board, before); assert.equal(h.state.status, 'idle'); h.cleanup();
});
test('a new puzzle supersedes solving and old results cannot overwrite it', async () => {
  const h = harness(); const solving = h.hook.solve(), old = h.workers[0];
  const generating = h.hook.newGame('Hard'), generation = h.workers[1];
  const next = l.generatePuzzle(115 / 256);
  generation.reply({ board: next.puzzle, solution: next.solution, checks: next.checks }); await generating;
  old.reply({ solved: true, board: sample.solution, nodes: 1, ms: 1 }); await solving;
  assert.deepEqual(h.state.board, next.puzzle); assert.equal(h.state.difficulty, 'Hard'); assert.ok(old.terminated); h.cleanup();
});
test('fallback uses original givens and reports actual nodes from both worker searches', async () => {
  const h = harness(); const solving = h.hook.solve();
  h.workers[0].reply({ solved: false, aborted: false, board: h.state.board.slice(), nodes: 3, ms: 2 }); await flush();
  assert.deepEqual(h.workers[1].request.board, h.state.givens);
  h.workers[1].reply({ solved: true, board: sample.solution.slice(), nodes: 10, ms: 5 }); await solving;
  assert.equal(h.state.stats.nodes, 13); assert.equal(h.state.stats.ms, 7); assert.equal(h.state.stats.usedGivensOnly, true); assert.equal(h.state.status, 'complete'); h.cleanup();
});
test('unmount rejects pending work and ignores late generation results', async () => {
  const h = harness(), before = h.state.board.slice(); const pending = h.hook.newGame('Medium');
  const worker = h.workers[0]; h.cleanup();
  worker.reply({ board: sample.solution, solution: sample.solution, checks: 0 }); await pending;
  assert.ok(worker.terminated); assert.deepEqual(h.state.board, before);
});

