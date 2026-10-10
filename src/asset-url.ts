/** Deployment-relative URL for public artwork and audio. */
export function assetUrl(path: string): string {
  if (path.startsWith('data:')) return path; // Optional offline packaging.
  const base = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
  return `${base}${path.replace(/^\//, '')}`;
}
