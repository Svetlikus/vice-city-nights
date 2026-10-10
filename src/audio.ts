import { assetUrl } from './asset-url';
/** User-supplied main music and original effects, independent of game results. */
export type SoundName = 'click' | 'spin' | 'stop' | 'win' | 'bigwin' | 'vip';
export type MusicMode = 'main' | 'vip';
const effects: Record<SoundName, string> = {
  click: 'button_click', spin: 'reel_spin', stop: 'reel_stop',
  win: 'coin_win', bigwin: 'celebration', vip: 'vip_transition',
};
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export class AudioManager {
  private context?: AudioContext;
  private musicGain?: GainNode;
  private sfxGain?: GainNode;
  private masterGain?: GainNode;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private voices = new Set<AudioBufferSourceNode>();
  private music?: { source: AudioBufferSourceNode; gain: GainNode; mode: MusicMode };
  private mainTrack?: { element: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode };
  private mode: MusicMode = 'main';
  private musicVolume = 0.18;
  private sfxVolume = 0.55;
  private isMuted = true;
  private unlocked = false;
  private destroyed = false;
  private musicRequest = 0;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  get muted(): boolean { return this.isMuted; }

  /** Invoke from a genuine click/tap/key event. Silent until the user enables sound. */
  async unlock(): Promise<void> {
    if (this.destroyed) return;
    if (!this.context) {
      const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      try {
        this.context = new Context();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 1;
        this.masterGain.connect(this.context.destination);
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.masterGain);
        this.sfxGain = this.context.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        this.sfxGain.connect(this.masterGain);
      } catch { return; }
    }
    this.unlocked = true;
    try { await this.context.resume(); } catch { return; }
    if (!this.isMuted && !this.destroyed) {
      void this.startMusic();
      // Secondary music is deliberately lazy; tiny reel effects are warmed after consent.
      for (const name of ['button_click', 'reel_spin', 'reel_stop', 'coin_win']) void this.load(name).catch(() => undefined);
    }
  }

  setMusicVolume(value: number): void {
    this.musicVolume = clamp(value);
    this.adjust(this.musicGain, this.musicVolume);
  }
  setSfxVolume(value: number): void {
    this.sfxVolume = clamp(value);
    this.adjust(this.sfxGain, this.sfxVolume);
  }
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.adjust(this.masterGain, this.isMuted ? 0 : 1);
    if (!this.isMuted) void this.unlock();
    return this.isMuted;
  }
  setMode(mode: MusicMode): void {
    this.mode = mode;
    ++this.musicRequest;
    if (this.unlocked && !this.isMuted) void this.startMusic();
  }

  play(name: SoundName): void {
    if (this.destroyed || this.isMuted || !this.unlocked || !this.context) return;
    const requested = performance.now();
    void this.load(effects[name]).then(buffer => {
      if (this.destroyed || this.isMuted || !this.context || !this.sfxGain) return;
      // Never play stale button or reel effects long after their visual event.
      if (['click', 'spin', 'stop'].includes(name) && performance.now() - requested > 450) return;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGain);
      this.voices.add(source);
      source.onended = () => { this.voices.delete(source); source.disconnect(); };
      source.start();
    }).catch(() => undefined); // Audio failure must never interrupt gameplay.
  }

  private adjust(gain: GainNode | undefined, value: number): void {
    if (!gain || !this.context) return;
    gain.gain.cancelScheduledValues(this.context.currentTime);
    gain.gain.setTargetAtTime(value, this.context.currentTime, 0.035);
  }
  private load(name: string): Promise<AudioBuffer> {
    const cached = this.buffers.get(name);
    if (cached) return cached;
    const request = (async () => {
      if (!this.context) throw new Error('Audio is not unlocked');
      const assetRoot = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
      const base = `${assetRoot}assets/audio/${name}.wav`;
      let bytes: ArrayBuffer;
      // Compressed transport with PCM fallback for older browsers. No codec dependency.
      if (typeof DecompressionStream !== 'undefined') {
        try {
          const compressed = await fetch(`${base}.gz`);
          if (!compressed.ok || !compressed.body) throw new Error('Missing compressed audio');
          bytes = await new Response(compressed.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        } catch {
          const fallback = await fetch(base);
          if (!fallback.ok) throw new Error(`Missing audio ${name}`);
          bytes = await fallback.arrayBuffer();
        }
      } else {
        const response = await fetch(base);
        if (!response.ok) throw new Error(`Missing audio ${name}`);
        bytes = await response.arrayBuffer();
      }
      if (this.destroyed || !this.context) throw new Error('Audio manager is closed');
      return this.context.decodeAudioData(bytes);
    })();
    this.buffers.set(name, request);
    void request.catch(() => this.buffers.delete(name));
    return request;
  }
  private async startMusic(): Promise<void> {
    if (!this.context || !this.musicGain || this.isMuted || this.destroyed) return;
    if (this.mode === 'vip' && this.music?.mode === 'vip') return;
    if (this.mode === 'main' && this.mainTrack && !this.mainTrack.element.paused && !this.music) return;
    const request = ++this.musicRequest;
    const mode = this.mode;
    try {
      if (mode === 'main') {
        if (!this.mainTrack) {
          // Stream the supplied recording without decoding six minutes into PCM.
          const element = document.createElement('audio');
          element.src = assetUrl('/assets/audio/main_theme.mp3');
          element.loop = true;
          element.preload = 'none';
          element.hidden = true;
          element.dataset.gameMusic = 'main';
          document.body.append(element);
          const source = this.context.createMediaElementSource(element);
          const gain = this.context.createGain();
          gain.gain.value = 0;
          source.connect(gain);
          gain.connect(this.musicGain);
          this.mainTrack = { element, source, gain };
        }
        await this.mainTrack.element.play();
        if (request !== this.musicRequest || this.destroyed || this.mode !== 'main') return;
        const now = this.context.currentTime;
        this.mainTrack.gain.gain.cancelScheduledValues(now);
        this.mainTrack.gain.gain.setValueAtTime(this.mainTrack.gain.gain.value, now);
        this.mainTrack.gain.gain.linearRampToValueAtTime(1, now + .65);
        const old = this.music;
        this.music = undefined;
        if (old) this.fadeOutMusic(old);
        return;
      }
      const buffer = await this.load('nightclub_theme');
      if (request !== this.musicRequest || this.mode !== mode || this.destroyed || this.isMuted || !this.context || !this.musicGain) return;
      if (this.music?.mode === mode) return;
      const now = this.context.currentTime;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + 0.65);
      gain.connect(this.musicGain);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buffer.duration;
      source.connect(gain);
      const old = this.music;
      this.music = { source, gain, mode };
      source.start();
      if (old) this.fadeOutMusic(old);
      if (this.mainTrack) {
        this.mainTrack.gain.gain.cancelScheduledValues(now);
        this.mainTrack.gain.gain.setValueAtTime(this.mainTrack.gain.gain.value, now);
        this.mainTrack.gain.gain.linearRampToValueAtTime(0, now + .65);
        const timer = setTimeout(() => {
          this.timers.delete(timer);
          if (this.mode === 'vip') this.mainTrack?.element.pause();
        }, 700);
        this.timers.add(timer);
      }
    } catch { /* Silent audio fallback keeps the slot playable. */ }
  }
  private fadeOutMusic(old: { source: AudioBufferSourceNode; gain: GainNode }): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0, now + .65);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      try { old.source.stop(); } catch { /* Already stopped. */ }
      old.source.disconnect(); old.gain.disconnect();
    }, 700);
    this.timers.add(timer);
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    ++this.musicRequest;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const source of this.voices) { try { source.stop(); } catch { /* Ended. */ } source.disconnect(); }
    this.voices.clear();
    if (this.music) { try { this.music.source.stop(); } catch { /* Ended. */ } this.music.source.disconnect(); this.music.gain.disconnect(); }
    if (this.mainTrack) {
      this.mainTrack.element.pause();
      this.mainTrack.element.removeAttribute('src');
      this.mainTrack.element.load();
      this.mainTrack.element.remove();
      this.mainTrack.source.disconnect(); this.mainTrack.gain.disconnect();
      this.mainTrack = undefined;
    }
    this.buffers.clear();
    this.musicGain?.disconnect(); this.sfxGain?.disconnect(); this.masterGain?.disconnect();
    if (this.context) void this.context.close().catch(() => undefined);
  }
}
