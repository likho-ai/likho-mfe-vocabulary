/** Words and classes shared by the sections. */

export function when(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export const LANGUAGE_WORDS: Record<string, string> = {
  hi: 'Hindi',
  en: 'English',
  ur: 'Urdu',
  mr: 'Marathi',
};

export function languageWord(code: string): string {
  return LANGUAGE_WORDS[code] ?? code;
}

export const field =
  'min-h-11 rounded-input border border-line-strong bg-surface px-3 text-ink focus-visible:outline-accent';

export const card = 'rounded-card border border-line bg-surface p-6 shadow-card';

export const failed = 'mt-2 text-sm text-[var(--likho-status-failed-ink)]';
