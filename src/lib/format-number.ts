/** "840 ms", "3.2 s". */
export function formatMs(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
}

/** "12 KB", "3.4 MB". */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** "1,284" → "1.3K" from ten thousand up. */
export function formatCount(n: number) {
  return n < 10_000 ? String(n) : `${(n / 1000).toFixed(1)}K`;
}
