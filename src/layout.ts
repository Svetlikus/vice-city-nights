export class ResponsiveLayoutManager {
  readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private observer: ResizeObserver;
  constructor(element: HTMLElement) {
    this.observer = new ResizeObserver(entries=>{
      const width = entries[0]?.contentRect.width ?? innerWidth;
      element.dataset.layout = width < 620 ? 'portrait' : width < 1050 ? 'compact' : 'cinema';
    });
    this.observer.observe(element);
  }
  destroy():void { this.observer.disconnect(); }
}
