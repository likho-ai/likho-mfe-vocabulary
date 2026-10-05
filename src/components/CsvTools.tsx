/** Export the table as CSV; load a CSV into it. */
import { Button } from '@likho-ai/ui';
import { saveTextFile } from '@likho-ai/web-sdk';
import type { UseMutationResult } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

export interface ImportOutcome {
  added: number;
  updated: number;
}

interface Props {
  what: string;
  fileName: string;
  columns: string;
  canChange: boolean;
  importCsv: UseMutationResult<ImportOutcome, Error, string>;
  exportCsv: UseMutationResult<string, Error, void>;
}

export function CsvTools({ what, fileName, columns, canChange, importCsv, exportCsv }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState('');

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    importCsv.mutate(text, {
      onSuccess: (result) => setOutcome(`${result.added} added, ${result.updated} updated.`),
      onError: (error) => setOutcome(error.message),
    });
  };

  const download = () =>
    exportCsv.mutate(undefined, {
      onSuccess: (text) => saveTextFile(fileName, text, 'text/csv'),
      onError: (error) => setOutcome(error.message),
    });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Button variant="ghost" size="sm" onClick={download} disabled={exportCsv.isPending}>
        <Download aria-hidden="true" className="size-4" />
        Export CSV
      </Button>
      {canChange && (
        <>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label={`Import ${what} CSV`}
            onChange={onFile}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={importCsv.isPending}
          >
            <Upload aria-hidden="true" className="size-4" />
            Import CSV
          </Button>
        </>
      )}
      <span className="text-xs text-ink-3">Columns: {columns}</span>
      {outcome && (
        <span role="status" className="text-ink-2">
          {outcome}
        </span>
      )}
    </div>
  );
}
