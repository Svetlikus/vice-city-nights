import { DemoProvider, evaluate, isValidBet, money, type ResultProvider, type SpinResult } from './engine';

export type GamePhase = 'ready' | 'spinning' | 'settling' | 'celebrating';
export interface HistoryEntry { readonly id: string; readonly bet: number; readonly win: number; readonly feature: boolean; readonly balance: number }

/** One authoritative demo account. UI animation can request transitions, never change values. */
export class GameState {
  private balanceValue: number;
  private betValue = 1;
  private phaseValue: GamePhase = 'ready';
  private resultValue: SpinResult | null = null;
  private readonly settledIds = new Set<string>();
  private readonly entries: HistoryEntry[] = [];
  private pendingBet: number | null = null;
  constructor(private readonly provider: ResultProvider = new DemoProvider(), initialBalance = 1000) {
    if (!Number.isFinite(initialBalance) || initialBalance < 0) throw new Error('Invalid initial demo balance.');
    this.balanceValue = money(initialBalance);
  }
  get balance(): number { return this.balanceValue; }
  get bet(): number { return this.betValue; }
  get phase(): GamePhase { return this.phaseValue; }
  get currentResult(): SpinResult | null { return this.resultValue; }
  get history(): readonly HistoryEntry[] { return Object.freeze([...this.entries]); }
  get canSpin(): boolean { return this.phaseValue === 'ready' && this.balanceValue >= this.betValue; }
  setBet(value: number): boolean {
    if (this.phaseValue !== 'ready' || !isValidBet(value)) return false;
    this.betValue = value;
    return true;
  }
  async startSpin(): Promise<SpinResult> {
    if (this.phaseValue !== 'ready') throw new Error('A round is already in progress.');
    if (this.balanceValue < this.betValue) throw new Error('Not enough demo credits.');
    const bet = this.betValue;
    this.phaseValue = 'spinning';
    this.resultValue = null;
    this.pendingBet = bet;
    this.balanceValue = money(this.balanceValue - bet);
    try {
      const result = await this.provider.requestSpin(bet);
      if (!result || typeof result.id !== 'string' || !result.id || result.id.startsWith('preview-')) throw new Error('Invalid playable result identifier.');
      if (result.bet !== bet || this.settledIds.has(result.id)) throw new Error('Result does not match the current round.');
      const verified = evaluate(result.grid, bet);
      if (result.totalWin !== verified.totalWin || result.feature !== verified.feature || JSON.stringify(result.wins) !== JSON.stringify(verified.wins)) throw new Error('Result payout failed validation.');
      // Retain a fresh immutable evaluator result, never a mutable provider object.
      this.resultValue = Object.freeze({ id: result.id, ...verified });
      return this.resultValue;
    } catch (error) {
      this.balanceValue = money(this.balanceValue + bet);
      this.pendingBet = null;
      this.phaseValue = 'ready';
      throw error;
    }
  }
  settle(resultId: string): boolean {
    const result = this.resultValue;
    if (this.phaseValue !== 'spinning' || !result || result.id !== resultId || this.pendingBet === null || this.settledIds.has(resultId)) return false;
    this.phaseValue = 'settling';
    this.settledIds.add(resultId);
    this.balanceValue = money(this.balanceValue + result.totalWin);
    this.pendingBet = null;
    this.entries.unshift(Object.freeze({ id: result.id, bet: result.bet, win: result.totalWin, feature: result.feature, balance: this.balanceValue }));
    this.entries.splice(30);
    this.phaseValue = result.totalWin > 0 ? 'celebrating' : 'ready';
    return true;
  }
  finishCelebration(): void { if (this.phaseValue === 'celebrating') this.phaseValue = 'ready'; }
  resetCredits(): boolean {
    if (this.phaseValue !== 'ready') return false;
    this.balanceValue = 1000;
    this.entries.length = 0;
    this.resultValue = null;
    return true;
  }
}
