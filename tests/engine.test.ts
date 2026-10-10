import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BETS, COIN_VALUES, DEMO_VIP_MULTIPLIER, DemoProvider, PAYLINES, REEL_STRIPS, REGULAR_IDS,
  SYMBOLS, createPreviewResult, evaluate, money, type Grid, type ResultProvider,
  type SpinResult, type SymbolCell, type SymbolId,
} from '../src/engine';
import { GameState } from '../src/state';

function blankGrid(): SymbolCell[][] {
  const ids: SymbolId[] = ['car', 'cocktail', 'fixer', 'racer', 'queen', 'enforcer', 'kingpin'];
  return Array.from({ length: 5 }, (_, reel) => Array.from({ length: 3 }, (_, row) => ({ id: ids[(reel + row * 2) % ids.length] })));
}
function putLine(grid: SymbolCell[][], line: number, symbol: SymbolId, count: number, value?: number): void {
  for (let reel = 0; reel < count; reel++) grid[reel][PAYLINES[line][reel]] = value === undefined ? { id: symbol } : { id: symbol, value };
}
function playable(kind: 'line' | 'cash' | 'vip' | 'big', id = 'test-round', bet = 1): SpinResult {
  return { id, ...evaluate(createPreviewResult(kind).grid, bet) };
}
function provider(result: SpinResult): ResultProvider { return { requestSpin: async () => result }; }
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

test('all five confirmed line paths pay the matching run from the first reel', () => {
  for (let line = 0; line < PAYLINES.length; line++) {
    const grid = blankGrid();
    putLine(grid, line, 'kingpin', 5);
    const win = evaluate(grid, 1).wins.find(win => win.line === line + 1);
    assert.ok(win, `Missing line ${line + 1}`);
    assert.equal(win.amount, 40);
    assert.deepEqual(win.cells, PAYLINES[line].map((row, reel) => ({ reel, row })));
  }
});

test('each regular symbol pays its documented 3/4/5 total-bet ratio', () => {
  for (const id of REGULAR_IDS) for (const count of [3, 4, 5]) {
    const grid = blankGrid();
    putLine(grid, 0, id, count);
    if (count < 5) grid[count][1] = { id: id === 'car' ? 'cocktail' : 'car' };
    const win = evaluate(grid, 2).wins.find(win => win.line === 1);
    assert.equal(win?.amount, SYMBOLS[id].pays[count - 3] * 2, `${id}/${count}`);
  }
});

test('a matching run beginning on reel two pays nothing', () => {
  const grid = blankGrid();
  grid[0][1] = { id: 'car' };
  for (let reel = 1; reel < 5; reel++) grid[reel][1] = { id: 'kingpin' };
  assert.equal(evaluate(grid, 1).wins.some(win => win.line === 1), false);
});

test('a broken run does not count matching symbols beyond the break', () => {
  const grid = blankGrid();
  grid[0][1] = { id: 'kingpin' };
  grid[1][1] = { id: 'kingpin' };
  grid[2][1] = { id: 'car' };
  grid[3][1] = { id: 'kingpin' };
  grid[4][1] = { id: 'kingpin' };
  assert.equal(evaluate(grid, 1).wins.some(win => win.line === 1), false);
});

test('five matches award the five-symbol prize once rather than adding shorter prizes', () => {
  const grid = blankGrid();
  putLine(grid, 0, 'kingpin', 5);
  const wins = evaluate(grid, 1).wins.filter(win => win.line === 1);
  assert.equal(wins.length, 1);
  assert.equal(wins[0].amount, 40);
});

test('cash sums only its qualifying consecutive-left run and rounds to cents', () => {
  const grid = blankGrid();
  [2, 4, 6].forEach((value, reel) => { grid[reel][1] = { id: 'cash', value }; });
  grid[3][1] = { id: 'car' };
  grid[4][1] = { id: 'cash', value: 100 };
  const win = evaluate(grid, 0.05).wins.find(win => win.line === 1);
  assert.equal(win?.amount, 0.6);
  assert.equal(win?.cells.length, 3);
});

test('two cash coins and a later coin do not qualify', () => {
  const grid = blankGrid();
  grid[0][1] = { id: 'cash', value: 20 };
  grid[1][1] = { id: 'cash', value: 20 };
  grid[2][1] = { id: 'car' };
  grid[3][1] = { id: 'cash', value: 20 };
  assert.equal(evaluate(grid, 1).wins.some(win => win.line === 1), false);
});

test('VIP feature accepts different rows, requires all three middle reels and scales with total bet', () => {
  const grid = blankGrid();
  grid[1][0] = { id: 'vip' };
  grid[2][2] = { id: 'vip' };
  assert.equal(evaluate(grid, 2).feature, false);
  grid[3][1] = { id: 'vip' };
  const result = evaluate(grid, 2);
  assert.equal(result.feature, true);
  assert.equal(result.wins.find(win => win.line === 0)?.amount, DEMO_VIP_MULTIPLIER * 2);
  assert.deepEqual(result.wins.find(win => win.line === 0)?.cells, [{ reel: 1, row: 0 }, { reel: 2, row: 2 }, { reel: 3, row: 1 }]);
});

test('cash and ordinary line wins are added to an independent VIP feature', () => {
  const grid = blankGrid();
  putLine(grid, 1, 'kingpin', 5);
  putLine(grid, 0, 'cash', 5, 10);
  for (let reel = 1; reel <= 3; reel++) grid[reel][2] = { id: 'vip' };
  const result = evaluate(grid, 1);
  assert.equal(result.totalWin, 1090);
});

test('evaluator rejects malformed dimensions, unknown symbols, invalid coins and misplaced VIP', () => {
  assert.throws(() => evaluate([] as Grid, 1));
  const missingRow = blankGrid(); missingRow[1].pop();
  assert.throws(() => evaluate(missingRow, 1));
  const unknown = blankGrid(); unknown[0][0] = { id: 'wild' as SymbolId };
  assert.throws(() => evaluate(unknown, 1));
  for (const value of [undefined, NaN, Infinity, -1, 0]) {
    const grid = blankGrid(); grid[0][0] = { id: 'cash', value };
    assert.throws(() => evaluate(grid, 1));
  }
  const extraValue = blankGrid(); extraValue[0][0] = { id: 'car', value: 2 };
  assert.throws(() => evaluate(extraValue, 1));
  const outerVIP = blankGrid(); outerVIP[0][0] = { id: 'vip' };
  assert.throws(() => evaluate(outerVIP, 1));
  const doubleVIP = blankGrid(); doubleVIP[1][0] = { id: 'vip' }; doubleVIP[1][2] = { id: 'vip' };
  assert.throws(() => evaluate(doubleVIP, 1));
  for (const bet of [0, -1, NaN, Infinity, 0.07]) assert.throws(() => evaluate(blankGrid(), bet));
});

test('documented demo strips have 80/81 stops and exactly one VIP on eligible reels', () => {
  assert.deepEqual(REEL_STRIPS.map(strip => strip.length), [80, 81, 81, 81, 80]);
  assert.deepEqual(REEL_STRIPS.map(strip => strip.filter(id => id === 'vip').length), [0, 1, 1, 1, 0]);
  for (const strip of REEL_STRIPS) {
    const expected = { kingpin: 5, queen: 8, enforcer: 8, racer: 9, fixer: 10, car: 15, cocktail: 18, cash: 7 };
    for (const [id, count] of Object.entries(expected)) assert.equal(strip.filter(symbol => symbol === id).length, count);
  }
  assert.equal(COIN_VALUES.reduce((sum, option) => sum + option.weight, 0), 83);
  // Exhaust every eligible reel stop to verify the probability, including wraparound.
  for (const reel of [1, 2, 3]) {
    const strip = REEL_STRIPS[reel];
    const stopsWithVIP = strip.filter((_, stop) => [0, 1, 2].some(row => strip[(stop + row) % strip.length] === 'vip')).length;
    assert.equal(stopsWithVIP, 3);
  }
});

test('provider uses reproducible independent draws and its generated results all validate', async () => {
  const a = new DemoProvider({ random: seeded(42) });
  const b = new DemoProvider({ random: seeded(42) });
  for (let spin = 0; spin < 200; spin++) {
    const bet = BETS[spin % BETS.length];
    const first = await a.requestSpin(bet);
    const second = await b.requestSpin(bet);
    assert.deepEqual(first.grid, second.grid);
    const checked = evaluate(first.grid, bet);
    assert.equal(first.totalWin, checked.totalWin);
    assert.equal(first.feature, checked.feature);
  }
});

test('provider rejects unsupported bets and invalid random sources', async () => {
  for (const sample of [-0.01, 1, NaN, Infinity]) await assert.rejects(new DemoProvider({ random: () => sample }).requestSpin(1));
  await assert.rejects(new DemoProvider().requestSpin(0.07));
});

test('result is immutable and does not retain a caller-owned grid', () => {
  const grid = blankGrid();
  const result = evaluate(grid, 1);
  const originalId = result.grid[0][0].id;
  grid[0][0] = { id: 'kingpin' };
  assert.equal(result.grid[0][0].id, originalId);
  assert.equal(Object.isFrozen(result.grid), true);
  assert.equal(Object.isFrozen(result.grid[0][0]), true);
});

test('account debits once, prevents overlapping requests, locks bet and credits once', async () => {
  let resolve!: (result: SpinResult) => void;
  const account = new GameState({ requestSpin: () => new Promise<SpinResult>(done => { resolve = done; }) });
  const pending = account.startSpin();
  assert.equal(account.balance, 999);
  assert.equal(account.phase, 'spinning');
  assert.equal(account.setBet(2), false);
  assert.equal(account.resetCredits(), false);
  await assert.rejects(account.startSpin(), /already in progress/);
  assert.equal(account.balance, 999);
  resolve(playable('line'));
  const result = await pending;
  assert.equal(account.settle('wrong-id'), false);
  assert.equal(account.balance, 999);
  assert.equal(account.settle(result.id), true);
  assert.equal(account.balance, 1009);
  assert.equal(account.phase, 'celebrating');
  assert.equal(account.settle(result.id), false);
  assert.equal(account.balance, 1009);
  assert.equal(account.history.length, 1);
  account.finishCelebration();
  assert.equal(account.phase, 'ready');
  assert.equal(account.setBet(2), true);
});

test('provider failure refunds the debit, releases locks and leaves no history', async () => {
  const account = new GameState({ requestSpin: async () => { throw new Error('offline'); } });
  await assert.rejects(account.startSpin(), /offline/);
  assert.equal(account.balance, 1000);
  assert.equal(account.phase, 'ready');
  assert.equal(account.currentResult, null);
  assert.equal(account.history.length, 0);
});

test('tampered payouts and mismatched bets are rejected and refunded', async () => {
  for (const result of [{ ...playable('line'), totalWin: 99999 }, { ...playable('line'), bet: 2 }, { ...playable('line'), wins: [] }]) {
    const account = new GameState(provider(result));
    await assert.rejects(account.startSpin());
    assert.equal(account.balance, 1000);
    assert.equal(account.phase, 'ready');
  }
});

test('scripted previews are isolated from account settlement', async () => {
  for (const kind of ['line', 'cash', 'vip', 'big'] as const) {
    const preview = createPreviewResult(kind);
    assert.equal(preview.id, `preview-${kind}`);
    const account = new GameState(provider(preview));
    await assert.rejects(account.startSpin(), /identifier/);
    assert.equal(account.balance, 1000);
    assert.equal(account.settle(preview.id), false);
  }
});

test('reused provider identifiers are rejected without another credit', async () => {
  const account = new GameState(provider(playable('line', 'same-id')));
  const result = await account.startSpin();
  account.settle(result.id);
  account.finishCelebration();
  await assert.rejects(account.startSpin(), /does not match/);
  assert.equal(account.balance, 1009);
  assert.equal(account.history.length, 1);
});

test('insufficient credits never call the provider or produce a negative balance', async () => {
  let requests = 0;
  const account = new GameState({ requestSpin: async () => { requests++; return playable('line'); } }, 0.5);
  assert.equal(account.canSpin, false);
  await assert.rejects(account.startSpin(), /Not enough/);
  assert.equal(requests, 0);
  assert.equal(account.balance, 0.5);
});

test('losing spin returns to ready and monetary arithmetic avoids floating-point residue', async () => {
  const account = new GameState(provider({ id: 'loss', ...evaluate(blankGrid(), 0.1) }));
  assert.equal(account.setBet(0.1), true);
  const result = await account.startSpin();
  account.settle(result.id);
  assert.equal(account.phase, 'ready');
  assert.equal(account.balance, 999.9);
  assert.equal(money(0.1 + 0.2), 0.3);
  assert.equal(account.resetCredits(), true);
  assert.equal(account.balance, 1000);
  assert.equal(account.history.length, 0);
});
