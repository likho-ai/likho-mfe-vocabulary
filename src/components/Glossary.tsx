/** The names the speech model listens for, with how often each was heard. */
import { Button } from '@likho-ai/ui';
import {
  useDeleteGlossaryTerm,
  useExportGlossaryCsv,
  useGlossary,
  useImportGlossaryCsv,
  useUpsertGlossaryTerm,
  type GlossaryTerm,
} from '@likho-ai/web-sdk';
import { X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { card, failed, field, languageWord, when } from '../lib/format';
import { CsvTools } from './CsvTools';

export function Glossary({ canChange }: { canChange: boolean }) {
  const glossary = useGlossary();
  const save = useUpsertGlossaryTerm();
  const remove = useDeleteGlossaryTerm();
  const importCsv = useImportGlossaryCsv();
  const exportCsv = useExportGlossaryCsv();
  const [term, setTerm] = useState('');
  const [language, setLanguage] = useState('hi');
  const [note, setNote] = useState('');

  // The names heard most come first; the rest in alphabetical order.
  const terms = useMemo(
    () => [...(glossary.data ?? [])].sort((a, b) => b.heard - a.heard || a.term.localeCompare(b.term)),
    [glossary.data],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!term.trim()) return;
    save.mutate(
      { term: term.trim(), language, note: note.trim() },
      {
        onSuccess: () => {
          setTerm('');
          setNote('');
        },
      },
    );
  };

  const toggle = (entry: GlossaryTerm) =>
    save.mutate({
      id: entry.id,
      term: entry.term,
      language: entry.language,
      enabled: !entry.enabled,
      note: entry.note,
    });

  return (
    <section className={card} aria-labelledby="glossary">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="glossary" className="text-xl font-bold">
            Glossary
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Product and person names the model listens for, in the script of the audio. Several words make a
            phrase. &ldquo;Heard&rdquo; counts the transcript lines that contained the name.
          </p>
        </div>
        <CsvTools
          what="glossary"
          fileName="glossary.csv"
          columns="term, language, enabled, note"
          canChange={canChange}
          importCsv={importCsv}
          exportCsv={exportCsv}
        />
      </div>

      {canChange && (
        <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
          <input
            aria-label="New glossary name"
            lang="hi"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="त्रिफला, or a phrase"
            className={field}
          />
          <select
            aria-label="Language of the name"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={field}
          >
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>
          <input
            aria-label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a herb, a person…"
            className={field}
          />
          <Button type="submit" variant="primary" disabled={save.isPending}>
            Add
          </Button>
        </form>
      )}
      {save.error && (
        <p role="alert" className={failed}>
          {save.error.message}
        </p>
      )}

      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-ink-3">
          <tr>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Kind</th>
            <th className="py-2 pr-4 font-medium">Language</th>
            <th className="py-2 pr-4 text-right font-medium">Heard</th>
            <th className="py-2 pr-4 font-medium">Last heard</th>
            <th className="py-2 pr-4 font-medium">On</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {terms.map((entry) => (
            <tr key={entry.id} className={`border-t border-line ${entry.enabled ? '' : 'text-ink-3'}`}>
              <td className="py-2 pr-4">
                <span lang={entry.language === 'en' ? undefined : 'hi'} className="font-medium">
                  {entry.term}
                </span>
                {entry.note && <span className="ml-2 text-ink-3">{entry.note}</span>}
              </td>
              <td className="py-2 pr-4 text-ink-2">{entry.isPhrase ? 'phrase' : 'word'}</td>
              <td className="py-2 pr-4 text-ink-2">{languageWord(entry.language)}</td>
              <td
                className="py-2 pr-4 text-right tabular-nums"
                aria-label={`${entry.term} heard ${entry.heard} times`}
              >
                {entry.heard}
              </td>
              <td className="py-2 pr-4 text-ink-2">{when(entry.lastHeardAt)}</td>
              <td className="py-2 pr-4">
                <input
                  type="checkbox"
                  checked={entry.enabled}
                  disabled={!canChange}
                  onChange={() => toggle(entry)}
                  aria-label={`${entry.term} on`}
                />
              </td>
              <td className="py-2 text-right">
                {canChange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${entry.term}`}
                    onClick={() => remove.mutate({ id: entry.id })}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {glossary.isSuccess && terms.length === 0 && (
            <tr>
              <td colSpan={7} className="py-3 text-ink-3">
                No names yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
