/** Original, consistent stroke icons. Accessible label belongs to the button. */
const paths: Record<string, string> = {
  spin: '<path d="M19.2 8.4A7.5 7.5 0 0 0 6 5.9L3.5 8.5M3.5 8.5V3.8M3.5 8.5h4.7M4.8 15.6A7.5 7.5 0 0 0 18 18.1l2.5-2.6M20.5 15.5v4.7M20.5 15.5h-4.7"/>',
  auto: '<path d="M4.5 9A7.8 7.8 0 1 1 5 16.2M4.5 9V4.5M4.5 9H9"/><path d="m10 8 6 4-6 4Z"/>',
  play: '<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none"/>',
  menu: '<path d="M4 5h16M4 12h16M4 19h16" stroke-width="3"/>',
  turbo: '<path d="m13.5 2-9 12h6L9.5 22l10-13h-6Z"/>',
  sound: '<path d="m4 9 4.5 0L14 4v16l-5.5-5H4Z"/><path d="M17 8.4a5 5 0 0 1 0 7.2M19.7 5.5a9 9 0 0 1 0 13"/>',
  muted: '<path d="m3 9 4.5 0L13 4v16l-5.5-5H3Z"/><path d="m17 9 5 6m0-6-5 6"/>',
  settings: '<path d="m10 2-.8 3.1-2.5 1.4-3.1-.8-2 3.6 2.3 2.3v2.8l-2.3 2.3 2 3.5 3.1-.7 2.5 1.4L10 24h4l.8-3.1 2.5-1.4 3.1.7 2-3.5-2.3-2.3v-2.8l2.3-2.3-2-3.6-3.1.8-2.5-1.4L14 2Z" transform="translate(0 -1) scale(1 .95)"/><circle cx="12" cy="12" r="3.4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7"/><circle cx="12" cy="7" r=".7" fill="currentColor"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  fullscreen: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
  history: '<path d="M4.5 8.5a9 9 0 1 1-.8 6M4.5 8.5v-5M4.5 8.5h5M12 7v5l3.5 2"/>',
  chevron: '<path d="m8 5 7 7-7 7"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
};
export function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}
