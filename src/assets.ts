import { assetUrl } from './asset-url';
import { SYMBOLS } from './engine';

/** Critical art is loaded before play; secondary scenes and audio stay lazy. */
export class AssetManager {
  readonly failed: string[] = [];
  async preload(progress: (fraction: number) => void): Promise<void> {
    const mascot = window.matchMedia('(min-width:621px) and (min-height:481px)').matches ? assetUrl('/assets/characters/kingpin_desktop.webp') : assetUrl('/assets/characters/kingpin.png');
    const urls = [...new Set([Object.values(SYMBOLS).flatMap(s => s.sprite ? [s.asset, s.sprite] : [s.asset]), [assetUrl('/assets/backgrounds/main_city.webp'), assetUrl('/assets/backgrounds/loading_boulevard.webp'), assetUrl('/assets/branding/logo.svg'), mascot]].flat())];
    let completed = 0;
    await Promise.all(urls.map(url => new Promise<void>(resolve => {
      const img = new Image();
      let done=false;
      const timeout=setTimeout(()=>finish(true),15000);
      const finish = (failed = false) => { if(done)return;done=true;clearTimeout(timeout); if (failed) this.failed.push(url); completed++; progress(completed / urls.length); resolve(); };
      img.onload = () => finish(); img.onerror = () => finish(true); img.src = url;
    })));
  }
}
