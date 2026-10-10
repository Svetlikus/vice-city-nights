import './effects.css';

/** State-driven presentation effects. No result calculation lives in this module. */
export class AnimationController {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private active = new Set<Animation>();
  private fields = new Set<HTMLElement>();
  private counters = new Set<{ frame: number; finish: () => void }>();
  private destroyed = false;
  private sequence = 0;

  constructor(private particles: HTMLElement) {}

  /** Compatibility for earlier callers; celebrations now use flying banknotes. */
  coins(amount = 28): void {
    this.cashBurst(amount, undefined, amount >= 60);
  }

  /**
   * Requested banknote count, with optional viewport-coordinate reel bounds.
   * Large bursts use five waves across the viewport; small bursts stay on reels.
   * Randomness here affects paper choreography only, never the fixed spin result.
   */
  cashBurst(amount = 36, bounds?: DOMRect, large = false): void {
    this.clear();
    if (this.destroyed || !Number.isFinite(amount) || amount <= 0) return;
    const sequence = this.sequence;
    const mobile = window.matchMedia('(max-width: 620px)').matches;
    const cap = large ? (mobile ? 78 : 168) : (mobile ? 30 : 54);
    const minimum = large ? (mobile ? 54 : 96) : 1;
    const count = Math.min(cap, Math.max(minimum, Math.round(amount)));
    const container = this.particles.getBoundingClientRect();
    const fallback = document.querySelector<HTMLElement>('#reels')?.getBoundingClientRect();
    const source = bounds ?? fallback;
    const region = large || !source
      ? { left: 0, top: 0, width: container.width || window.innerWidth, height: container.height || window.innerHeight }
      : { left: source.left - container.left, top: source.top - container.top, width: source.width, height: source.height };
    if (region.width <= 0 || region.height <= 0) return;
    const field = document.createElement('div');
    field.className = `cash-field${large ? ' cash-field-large' : ''}`;
    field.style.left = `${region.left}px`;
    field.style.top = `${region.top}px`;
    field.style.width = `${region.width}px`;
    field.style.height = `${region.height}px`;
    // The celebration has its own stacking context. Keeping large cash inside
    // it places the notes above its backdrop and below the title and counter.
    const host = large ? document.getElementById('celebration') ?? this.particles : this.particles;
    host.append(field);
    this.fields.add(field);

    const waves = large ? 5 : 3;
    const perWave = Math.ceil(count / waves);
    let lastFinish = 0;
    for (let index = 0; index < count; index++) {
      const note = document.createElement('i');
      note.className = 'particle-banknote';
      const wave = Math.floor(index / perWave);
      const direction = index % 2 === 0 ? -1 : 1;
      const scale = .72 + Math.random() * .52;
      const width = (large ? (mobile ? 51 : 76) : (mobile ? 42 : 62)) * scale;
      const originX = region.width * (large
        ? (direction < 0 ? .19 : .69) + Math.random() * .12
        : .2 + Math.random() * .6);
      const originY = region.height * (large ? .71 + Math.random() * .18 : .72 + Math.random() * .14);
      const sideTravel = region.width * (large ? .2 + Math.random() * .25 : .08 + Math.random() * .19) * direction;
      const lift = region.height * (large ? .58 + Math.random() * .29 : .62 + Math.random() * .26);
      const fall = region.height * (large ? .57 + Math.random() * .25 : .42 + Math.random() * .25);
      const tilt = -28 + Math.random() * 56;
      const turn = direction * (95 + Math.random() * 115);
      const duration = large ? 2700 + Math.random() * 850 : 1900 + Math.random() * 700;
      const delay = wave * (large ? 350 : 260) + Math.random() * 130;
      lastFinish = Math.max(lastFinish, duration + delay);
      note.style.left = `${originX}px`;
      note.style.top = `${originY}px`;
      note.style.width = `${width}px`;
      note.style.height = `${width / 2}px`;
      field.append(note);
      const transform = (x: number, y: number, rotation: number, flip: number) =>
        `perspective(700px) translate3d(${x}px,${y}px,0) rotate(${rotation}deg) rotateY(${flip}deg) rotateX(12deg)`;
      const movement = note.animate([
        { transform: transform(0, 0, tilt, 0), opacity: 0, offset: 0 },
        { transform: transform(sideTravel * .12, -lift * .25, tilt + turn * .1, 42), opacity: .96, offset: .08 },
        { transform: transform(sideTravel * .38, -lift * .77, tilt + turn * .38, 125), opacity: 1, offset: .24 },
        { transform: transform(sideTravel * .66, -lift, tilt + turn * .64, 210), opacity: 1, offset: .43 },
        { transform: transform(sideTravel * .84, -lift * .7, tilt + turn * .92, 338), opacity: .96, offset: .62 },
        { transform: transform(sideTravel, -lift * .07, tilt + turn * 1.25, 505), opacity: .87, offset: .82 },
        { transform: transform(sideTravel * 1.17, fall, tilt + turn * 1.5, 680), opacity: 0, offset: 1 },
      ], { duration, delay, easing: 'linear', fill: 'both' });
      this.active.add(movement);
      const remove = () => {
        this.active.delete(movement);
        note.remove();
        if (!field.childElementCount) {
          field.remove();
          this.fields.delete(field);
        }
      };
      void movement.finished.then(remove, remove);
    }
    this.timer = setTimeout(() => {
      if (sequence === this.sequence) this.clear();
    }, lastFinish + 80);
  }

  async count(element: HTMLElement, value: number, duration = 800): Promise<void> {
    if (this.destroyed) return;
    const total = Number.isFinite(value) ? value : 0;
    if (duration <= 0) {
      element.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return;
    }
    const start = performance.now();
    await new Promise<void>(resolve => {
      const counter = { frame: 0, finish: resolve };
      this.counters.add(counter);
      const step = (now: number) => {
        const fraction = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - fraction, 3);
        element.textContent = (total * eased).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (fraction < 1) counter.frame = requestAnimationFrame(step);
        else {
          this.counters.delete(counter);
          resolve();
        }
      };
      counter.frame = requestAnimationFrame(step);
    });
  }

  clear(): void {
    this.sequence++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.active.forEach(animation => animation.cancel());
    this.active.clear();
    this.fields.forEach(field => field.remove());
    this.fields.clear();
    this.particles.replaceChildren();
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    this.counters.forEach(counter => {
      cancelAnimationFrame(counter.frame);
      counter.finish();
    });
    this.counters.clear();
  }
}
