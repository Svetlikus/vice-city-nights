import { assetUrl } from './asset-url';
/** Transparent replacement mathematics for virtual-credit demonstration only. */
export const REGULAR_IDS = ['kingpin', 'queen', 'enforcer', 'racer', 'fixer', 'car', 'cocktail'] as const;
export type RegularSymbolId = typeof REGULAR_IDS[number];
export type SymbolId = RegularSymbolId | 'cash' | 'vip';
export interface SymbolCell { readonly id: SymbolId; readonly value?: number }
export type Grid = readonly (readonly SymbolCell[])[];
export interface CellPosition { readonly reel: number; readonly row: number }
export interface LineWin {
  /** 1–5 for a fixed payline; 0 for the independent VIP feature. */
  readonly line: number;
  readonly cells: readonly CellPosition[];
  readonly amount: number;
  readonly symbol: SymbolId;
}
export interface SpinResult {
  readonly id: string;
  readonly grid: Grid;
  readonly wins: readonly LineWin[];
  readonly totalWin: number;
  readonly feature: boolean;
  readonly bet: number;
}
export interface ResultProvider { requestSpin(bet: number): Promise<SpinResult> }
export interface SymbolMetadata { readonly label: string; readonly pays: readonly number[]; readonly asset: string; readonly sprite?: string; readonly description: string }

export const SYMBOLS: Readonly<Record<SymbolId, SymbolMetadata>> = Object.freeze({
  kingpin: { label: 'The Kingpin', pays: [10, 20, 40], asset: assetUrl('/assets/characters/kingpin.png'), sprite: assetUrl('/assets/characters/kingpin-portrait.png'), description: 'The city answers to him.' },
  queen: { label: 'The Nightclub Queen', pays: [4, 10, 20], asset: assetUrl('/assets/characters/queen.png'), sprite: assetUrl('/assets/characters/queen-portrait.png'), description: 'Every door opens for her.' },
  enforcer: { label: 'The Enforcer', pays: [4, 10, 20], asset: assetUrl('/assets/characters/enforcer.png'), sprite: assetUrl('/assets/characters/enforcer-portrait.png'), description: 'Power has a right hand.' },
  racer: { label: 'The Street Racer', pays: [2, 4, 8], asset: assetUrl('/assets/characters/racer.png'), sprite: assetUrl('/assets/characters/racer-portrait.png'), description: 'The boulevard is his runway.' },
  fixer: { label: 'The Fixer', pays: [2, 4, 8], asset: assetUrl('/assets/characters/fixer.png'), sprite: assetUrl('/assets/characters/fixer-portrait.png'), description: 'One call changes everything.' },
  car: { label: 'Midnight GT', pays: [2, 4, 8], asset: assetUrl('/assets/symbols/car-painted.png'), description: 'Chrome, speed and trouble.' },
  cocktail: { label: 'After Hours', pays: [1, 2, 4], asset: assetUrl('/assets/symbols/cocktail-painted.png'), description: 'A taste of the high life.' },
  cash: { label: 'Cash Coin', pays: [], asset: assetUrl('/assets/symbols/cash.svg'), description: 'Three or more consecutive coins from reel one pay their displayed values.' },
  vip: { label: 'VIP Takeover', pays: [], asset: assetUrl('/assets/symbols/vip.svg'), description: 'One on each middle reel awards 1,000× the total bet in this demo.' },
});
for (const metadata of Object.values(SYMBOLS)) {
  Object.freeze(metadata.pays);
  Object.freeze(metadata);
}

/** Rows are zero-based; the outside array is ordered by payline number. */
export const PAYLINES = Object.freeze([
  Object.freeze([1, 1, 1, 1, 1]),
  Object.freeze([0, 0, 0, 0, 0]),
  Object.freeze([2, 2, 2, 2, 2]),
  Object.freeze([0, 1, 2, 1, 0]),
  Object.freeze([2, 1, 0, 1, 2]),
]);
export const BETS = Object.freeze([0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 1, 2, 4, 6, 8, 10, 20, 40, 60, 80, 100]);
export const DEMO_VIP_MULTIPLIER = 1000;
export const COIN_VALUES = Object.freeze([
  { value: 2, weight: 22 }, { value: 4, weight: 20 }, { value: 6, weight: 16 },
  { value: 10, weight: 12 }, { value: 20, weight: 8 }, { value: 50, weight: 4 }, { value: 100, weight: 1 },
]);
for (const option of COIN_VALUES) Object.freeze(option);
export function money(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
export function isValidBet(bet: number): boolean { return Number.isFinite(bet) && BETS.includes(bet); }

/** Validate before rendering or accounting. Every VIP can appear at most once per eligible reel. */
export function validateGrid(grid: Grid): void {
  if (!Array.isArray(grid) || grid.length !== 5) throw new Error('A result must contain five reels.');
  for (let reel = 0; reel < 5; reel++) {
    const column = grid[reel];
    if (!Array.isArray(column) || column.length !== 3) throw new Error('Every reel must contain three visible symbols.');
    let vipCount = 0;
    for (const cell of column) {
      if (!cell || typeof cell !== 'object' || !Object.prototype.hasOwnProperty.call(SYMBOLS, cell.id)) throw new Error('Unknown symbol in result.');
      if (cell.id === 'cash') {
        if (!Number.isFinite(cell.value) || (cell.value ?? 0) <= 0 || (cell.value ?? 0) > 100000) throw new Error('Cash coins require a positive finite value.');
      } else if (cell.value !== undefined) throw new Error('Only cash coins can carry a value.');
      if (cell.id === 'vip') {
        if (reel === 0 || reel === 4) throw new Error('VIP symbols are restricted to the three middle reels.');
        vipCount++;
      }
    }
    if (vipCount > 1) throw new Error('Each middle reel can contain at most one visible VIP symbol.');
  }
}

function freezeGrid(grid: Grid): Grid {
  return Object.freeze(grid.map(column => Object.freeze(column.map(cell => Object.freeze({ ...cell })))));
}

/** Pure evaluation; animation never influences results. Payout ratios use TOTAL bet. */
export function evaluate(grid: Grid, bet: number): Omit<SpinResult, 'id'> {
  if (!isValidBet(bet)) throw new Error('Select a supported total bet.');
  validateGrid(grid);
  const wins: LineWin[] = [];
  PAYLINES.forEach((rows, index) => {
    const first = grid[0][rows[0]];
    if (first.id === 'vip') return;
    let count = 1;
    while (count < 5 && grid[count][rows[count]].id === first.id) count++;
    if (count < 3) return;
    const cells = Object.freeze(rows.slice(0, count).map((row, reel) => Object.freeze({ reel, row })));
    const multiplier = first.id === 'cash'
      ? cells.reduce((total, cell) => total + (grid[cell.reel][cell.row].value ?? 0), 0)
      : SYMBOLS[first.id].pays[count - 3];
    wins.push(Object.freeze({ line: index + 1, cells, amount: money(multiplier * bet), symbol: first.id }));
  });
  const featureCells: CellPosition[] = [];
  for (let reel = 1; reel <= 3; reel++) {
    const row = grid[reel].findIndex(cell => cell.id === 'vip');
    if (row >= 0) featureCells.push(Object.freeze({ reel, row }));
  }
  const feature = featureCells.length === 3;
  if (feature) wins.push(Object.freeze({ line: 0, cells: Object.freeze(featureCells), amount: money(DEMO_VIP_MULTIPLIER * bet), symbol: 'vip' }));
  return Object.freeze({ grid: freezeGrid(grid), wins: Object.freeze(wins), totalWin: money(wins.reduce((total, win) => total + win.amount, 0)), feature, bet });
}

// Eighty openly declared stops. K=Kingpin, Q=Queen, E=Enforcer, R=Racer,
// F=Fixer, C=Car, D=Cocktail, $=cash. Middle reels insert one VIP stop.
const STRIP_KEY: Record<string, SymbolId> = { K: 'kingpin', Q: 'queen', E: 'enforcer', R: 'racer', F: 'fixer', C: 'car', D: 'cocktail', $: 'cash' };
const BASE_STRIP_TEXT = 'D C R Q F D C $ E C D K F R D C Q $ D E C F R D K C Q E $ D F C R D Q C E D F R $ C D K Q F C D E R D C $ Q F D C R E D K C F $ D Q R C E D F K C $ R D E Q F D';
const BASE_STRIP = BASE_STRIP_TEXT.split(' ').map(key => STRIP_KEY[key]);
function rotateStrip(offset: number, vipPosition?: number): readonly SymbolId[] {
  const rotated = [...BASE_STRIP.slice(offset), ...BASE_STRIP.slice(0, offset)];
  if (vipPosition !== undefined) rotated.splice(vipPosition, 0, 'vip');
  return Object.freeze(rotated);
}
export const REEL_STRIPS: readonly (readonly SymbolId[])[] = Object.freeze([
  rotateStrip(0), rotateStrip(17, 9), rotateStrip(39, 31), rotateStrip(57, 61), rotateStrip(71),
]);

export type RandomSource = () => number;
let resultSequence = 0;
export class DemoProvider implements ResultProvider {
  private readonly random: RandomSource | undefined;
  constructor(options: { random?: RandomSource } = {}) { this.random = options.random; }
  private draw(size: number): number {
    if (!this.random && globalThis.crypto?.getRandomValues) {
      // Rejection sampling keeps integer stops uniform when size does not divide 2³².
      const limit = Math.floor(4294967296 / size) * size;
      let value: number;
      do { value = globalThis.crypto.getRandomValues(new Uint32Array(1))[0]; } while (value >= limit);
      return value % size;
    }
    const sample = this.random ? this.random() : Math.random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Invalid demo random source.');
    return Math.floor(sample * size);
  }
  private coinValue(): number {
    let draw = this.draw(COIN_VALUES.reduce((sum, option) => sum + option.weight, 0));
    for (const option of COIN_VALUES) {
      if (draw < option.weight) return option.value;
      draw -= option.weight;
    }
    throw new Error('Invalid coin distribution.');
  }
  async requestSpin(bet: number): Promise<SpinResult> {
    if (!isValidBet(bet)) throw new Error('Select a supported total bet.');
    const grid = REEL_STRIPS.map(strip => {
      const stop = this.draw(strip.length);
      return [0, 1, 2].map(row => {
        const id = strip[(stop + row) % strip.length];
        return id === 'cash' ? { id, value: this.coinValue() } : { id };
      });
    });
    return Object.freeze({ id: `demo-${++resultSequence}`, ...evaluate(grid, bet) });
  }
}

export type PreviewKind = 'line' | 'cash' | 'vip' | 'big';
/** Scripted feature-tour illustration. Must never pass through debit/settlement. */
export function createPreviewResult(kind: PreviewKind): SpinResult {
  const fillers: SymbolId[] = ['cocktail', 'car', 'fixer', 'racer', 'enforcer', 'queen', 'kingpin'];
  const grid: SymbolCell[][] = Array.from({ length: 5 }, (_, reel) => Array.from({ length: 3 }, (_, row) => ({ id: fillers[(reel + row * 2) % fillers.length] })));
  if (kind === 'line') {
    for (let reel = 0; reel < 3; reel++) grid[reel][1] = { id: 'kingpin' };
    grid[3][1] = { id: 'car' };
    grid[4][1] = { id: 'car' };
  }
  if (kind === 'cash') for (let reel = 0; reel < 5; reel++) grid[reel][1] = { id: 'cash', value: [2, 4, 10, 20, 50][reel] };
  if (kind === 'vip') for (let reel = 1; reel <= 3; reel++) grid[reel][reel - 1] = { id: 'vip' };
  if (kind === 'big') for (let reel = 0; reel < 5; reel++) for (let row = 0; row < 3; row++) grid[reel][row] = { id: 'kingpin' };
  return Object.freeze({ id: `preview-${kind}`, ...evaluate(grid, 1) });
}
