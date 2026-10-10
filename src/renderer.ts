import { SYMBOLS, REEL_STRIPS, type Grid, type SymbolCell, type SpinResult } from './engine';

export function symbolHTML(cell: SymbolCell, reel = -1, row = -1, bet = 1): string {
  const symbol = SYMBOLS[cell.id];
  const artwork = symbol.sprite ?? symbol.asset;
  const value = cell.id === 'cash'
    ? ((cell.value ?? 0) * bet).toLocaleString('en-US', { maximumFractionDigits: 2 })
    : '';
  return `<div class="symbol symbol-${cell.id}" data-reel="${reel}" data-row="${row}" aria-label="${symbol.label}${value ? `, ${value} credits` : ''}"><span class="symbol-halo"></span><img src="${artwork}" alt="" draggable="false"/>${value ? `<span class="coin-value">${value}<small>CREDITS</small></span>` : ''}<span class="cell-corner"></span></div>`;
}

/** Reels present an already fixed result; their travel never selects a symbol. */
export class ReelRenderer {
  private animations = new Set<Animation>();
  private grid: Grid;
  private destroyed = false;
  private sequence = 0;

  constructor(private element: HTMLElement, initial: Grid) {
    this.grid = initial;
    this.render(initial);
  }

  render(grid: Grid, bet = 1): void {
    if (this.destroyed) return;
    this.sequence++;
    this.cancelAnimations();
    this.element.classList.remove('spinning', 'has-win');
    this.grid = grid;
    this.describe(grid);
    this.element.innerHTML = grid.map((column, reel) =>
      `<div class="reel" data-column="${reel}"><div class="reel-strip">${column.map((cell, row) => symbolHTML(cell, reel, row, bet)).join('')}</div></div>`
    ).join('');
  }

  private describe(grid: Grid, result?: SpinResult): void {
    this.element.setAttribute('aria-label',
      `Five reels, three rows. ${grid.map((column, index) => `Reel ${index + 1}: ${column.map(cell => SYMBOLS[cell.id].label).join(', ')}`).join('. ')}.${result ? ` Result: ${result.totalWin.toFixed(2)} virtual credits won.` : ''}`
    );
  }

  clearWins(): void {
    this.element.classList.remove('has-win');
    this.element.querySelectorAll('.symbol').forEach(cell => cell.classList.remove('winner'));
  }

  highlight(result: SpinResult): void {
    if (!result.totalWin) return;
    this.element.classList.add('has-win');
    result.wins.flatMap(win => [...win.cells]).forEach(({ reel, row }) =>
      this.element.querySelector(`[data-reel="${reel}"][data-row="${row}"]`)?.classList.add('winner')
    );
  }

  private async finish(animation: Animation): Promise<void> {
    this.animations.add(animation);
    try {
      await animation.finished;
    } catch {
      // A newer render or destruction owns the presentation after cancellation.
    } finally {
      this.animations.delete(animation);
    }
  }

  private cancelAnimations(): void {
    this.animations.forEach(animation => animation.cancel());
    this.animations.clear();
  }

  async spin(result: SpinResult, turbo: boolean, reducedMotion: boolean, onStop: () => void): Promise<void> {
    if (this.destroyed) return;
    const sequence = ++this.sequence;
    this.cancelAnimations();
    this.clearWins();
    this.element.classList.add('spinning');
    const old = this.grid;
    const reels = Array.from(this.element.querySelectorAll<HTMLElement>('.reel'));
    const current = () => !this.destroyed && sequence === this.sequence;

    await Promise.all(reels.map(async (reel, index) => {
      const strip = reel.querySelector<HTMLElement>('.reel-strip')!;
      const targetHTML = result.grid[index].map((cell, row) => symbolHTML(cell, index, row, result.bet)).join('');
      reel.classList.add('reel-moving');

      if (reducedMotion) {
        const fadeOut = strip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 65, fill: 'forwards' });
        await this.finish(fadeOut);
        if (!current()) return;
        strip.style.opacity = '0';
        fadeOut.cancel();
        strip.innerHTML = targetHTML;
        const fadeIn = strip.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 65, fill: 'forwards' });
        await this.finish(fadeIn);
        if (!current()) return;
        strip.style.opacity = '';
        fadeIn.cancel();
      } else {
        const fillerCount = turbo ? 6 + index : 13 + index * 2;
        const filler: SymbolCell[] = Array.from({ length: fillerCount }, (_, step) => {
          const id = REEL_STRIPS[index][(step * 7 + index * 9) % REEL_STRIPS[index].length];
          return id === 'cash' ? { id, value: 10 } : { id };
        });
        // The old window starts below the target. Moving the strip down exposes
        // the fixed target; guard cells keep the short landing fully populated.
        const guard = filler[0];
        const cells = [guard, ...result.grid[index], ...filler, ...old[index], guard];
        strip.innerHTML = cells.map(cell => symbolHTML(cell, -1, -1, result.bet)).join('');
        const rowPercent = 100 / 3;
        const start = -(4 + fillerCount) * rowPercent;
        const end = -rowPercent;
        const travel = end - start;
        const position = (fraction: number, pixels = 0) =>
          `translate3d(0, calc(${start + travel * fraction}% + ${pixels}px), 0)`;
        strip.style.transform = position(0);
        strip.classList.add('reel-rolling');
        const duration = turbo ? 390 + index * 45 : 1050 + index * 145;
        const movement = strip.animate([
          { transform: position(0), filter: 'blur(0px)', offset: 0, easing: 'cubic-bezier(.5,0,.85,.55)' },
          { transform: position(.12), filter: 'blur(1.25px)', offset: .25, easing: 'linear' },
          { transform: position(.74), filter: 'blur(1.25px)', offset: .68, easing: 'cubic-bezier(.28,.4,.6,1)' },
          { transform: position(1, 2.2), filter: 'blur(0px)', offset: .94, easing: 'ease-out' },
          { transform: position(1, -.65), filter: 'blur(0px)', offset: .975, easing: 'ease-out' },
          { transform: position(1), filter: 'blur(0px)', offset: 1 },
        ], { duration, fill: 'forwards' });
        await this.finish(movement);
        if (!current()) return;
        // Both windows have identical cell geometry at this point, so the
        // compact resting DOM replaces the travel strip without a visual jump.
        strip.style.transform = '';
        strip.innerHTML = targetHTML;
        movement.cancel();
        strip.classList.remove('reel-rolling');
      }
      if (!current()) return;
      reel.classList.remove('reel-moving');
      onStop();
    }));

    if (!current()) return;
    this.grid = result.grid;
    this.describe(result.grid, result);
    this.element.classList.remove('spinning');
  }

  destroy(): void {
    this.destroyed = true;
    this.sequence++;
    this.cancelAnimations();
    this.element.classList.remove('spinning');
    this.element.querySelectorAll('.reel').forEach(reel => reel.classList.remove('reel-moving'));
  }
}
