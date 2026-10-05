/** How words and phrases are written in Hinglish, with how often each spelling was applied. */
import { Button } from '@likho-ai/ui';
import {
  useDeleteSpelling,
  useExportSpellingsCsv,
  useImportSpellingsCsv,
  useSpellings,
  useUpsertSpelling,
  type Spelling,
} from '@likho-ai/web-sdk';
import { useMemo, useState, type FormEvent } from 'react';
import { card, failed, field, when } from '../lib/format';
import { CsvTools } from './CsvTools';

export function Spellings({ canChange }: { canChange: boolean }) {
  const spellings = useSpellings();
  const save = useUpsertSpelling();
  const remove = useDeleteSpelling();
  const importCsv = useImportSpellingsCsv();
  const exportCsv = useExportSpellingsCsv();
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

  const entries = useMemo(
    () =>
      [...(spellings.data ?? [])].sort((a, b) => b.applied - a.applied || a.source.localeCompare(b.source)),
    [spellings.data],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!source.trim() || !target.trim()) return;
    save.mutate(
      { source: source.trim(), target: target.trim() },
      {
        onSuccess: () => {
          setSource('');
          setTarget('');
        },
      },
    );
  };

  const toggle = (entry: Spelling) =>
    save.mutate({ id: entry.id, source: entry.source, target: entry.target, enabled: !entry.enabled });

  return (
    <section className={card} aria-labelledby="spellings">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="spellings" className="text-xl font-bold">
            Spellings
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Heard as (Devanagari) → written as (Hinglish). Several words make a phrase. &ldquo;Applied&rdquo;
            counts the transcript lines the spelling was used in; the last few are kept as examples.
          </p>
        </div>
        <CsvTools
          what="spellings"
          fileName="spellings.csv"
          columns="source, target, enabled"
          canChange={canChange}
          importCsv={importCsv}
          exportCsv={exportCsv}
        />
      </div>

      {canChange && (
        <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            aria-label="Heard as"
            lang="hi"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="त्रिफला"
            className={field}
          />
          <input
            aria-label="Written as"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Triphala"
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
            <th className="py-2 pr-4 font-medium">Heard as</th>
            <th className="py-2 pr-4 font-medium">Written as</th>
            <th className="py-2 pr-4 font-medium">Kind</th>
            <th className="py-2 pr-4 text-right font-medium">Applied</th>
            <th className="py-2 pr-4 font-medium">Last applied</th>
            <th className="py-2 pr-4 font-medium">On</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <>
              <tr key={entry.id} className={`border-t border-line ${entry.enabled ? '' : 'text-ink-3'}`}>
                <td className="py-2 pr-4" lang="hi">
                  {entry.source}
                </td>
                <td className="py-2 pr-4 font-medium">{entry.target}</td>
                <td className="py-2 pr-4 text-ink-2">{entry.isPhrase ? 'phrase' : 'word'}</td>
                <td
                  className="py-2 pr-4 text-right tabular-nums"
                  aria-label={`${entry.source} applied ${entry.applied} times`}
                >
                  {entry.applied}
                </td>
                <td className="py-2 pr-4 text-ink-2">{when(entry.lastAppliedAt)}</td>
                <td className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked={entry.enabled}
                    disabled={!canChange}
                    onChange={() => toggle(entry)}
                    aria-label={`${entry.source} on`}
                  />
                </td>
                <td className="py-2 text-right">
                  {canChange && (
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate({ id: entry.id })}>
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
              {entry.examples.length > 0 && (
                <tr key={`${entry.id}-examples`} className="text-xs">
                  <td colSpan={7} className="pb-2 pr-4">
                    <details>
                      <summary className="cursor-pointer text-ink-3">
                        {entry.examples.length === 1 ? '1 example' : `${entry.examples.length} examples`}
                      </summary>
                      <ul className="mt-1 space-y-1" aria-label={`Lines ${entry.source} was applied to`}>
                        {entry.examples.map((example) => (
                          <li
                            key={`${example.recordingId}-${example.segmentIndex}`}
                            className="flex flex-wrap gap-x-2"
                          >
                            <span lang="hi" className="text-ink-2">
                              {example.before}
                            </span>
                            <span aria-hidden="true">→</span>
                            <span className="text-ink">{example.after}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                </tr>
              )}
            </>
          ))}
          {spellings.isSuccess && entries.length === 0 && (
            <tr>
              <td colSpan={7} className="py-3 text-ink-3">
                No spellings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
