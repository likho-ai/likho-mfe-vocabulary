import { saveTextFile } from '@likho-ai/web-sdk';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../src/App';
import { fakeApi, person, renderAt } from './helpers';

vi.mock('@likho-ai/web-sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@likho-ai/web-sdk')>()),
  saveTextFile: vi.fn(),
}));

const term = (id: string, text: string, heard: number, extra: Record<string, unknown> = {}) => ({
  id,
  term: text,
  language: 'hi',
  enabled: true,
  note: '',
  isPhrase: text.includes(' '),
  heard,
  lastHeardAt: heard ? new Date().toISOString() : null,
  ...extra,
});

const spelling = (id: string, source: string, target: string, applied: number, examples: unknown[] = []) => ({
  id,
  source,
  target,
  isPhrase: source.includes(' '),
  enabled: true,
  applied,
  lastAppliedAt: applied ? new Date().toISOString() : null,
  examples,
});

const quiet = {
  Me: () => ({ me: person }),
  Glossary: () => ({ glossary: [] }),
  Spellings: () => ({ spellings: [] }),
};

describe('the vocabulary app', () => {
  it('shows the names heard most first, with their counts, and adds one', async () => {
    const names = [
      term('gls_1', 'अश्वगंधा', 0),
      term('gls_2', 'Triphala Churna', 12, { language: 'en', note: 'powder' }),
      term('gls_3', 'नीम', 3),
    ];
    const { client, calls } = fakeApi({
      ...quiet,
      Glossary: () => ({ glossary: names }),
      UpsertGlossaryTerm: (v) => {
        const input = v.input as { term: string; language: string; note: string };
        const added = term('gls_4', input.term, 0, { language: input.language, note: input.note });
        names.push(added);
        return { upsertGlossaryTerm: added };
      },
    });
    renderAt('/vocabulary', <App />, client);
    expect(await screen.findByRole('heading', { name: 'Glossary' })).toBeInTheDocument();
    const table = (await screen.findByRole('heading', { name: 'Glossary' })).closest('section')!;
    await within(table).findByText('Triphala Churna');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[0]!.textContent)).toEqual([
      'Triphala Churnapowder',
      'नीम',
      'अश्वगंधा',
    ]);
    expect(within(rows[0]!).getByLabelText('Triphala Churna heard 12 times')).toHaveTextContent('12');
    expect(within(rows[0]!).getAllByRole('cell')[1]).toHaveTextContent('phrase');
    expect(within(rows[0]!).getAllByRole('cell')[2]).toHaveTextContent('English');
    expect(within(rows[2]!).getAllByRole('cell')[4]).toHaveTextContent('—');

    const u = userEvent.setup();
    await u.type(await screen.findByLabelText('New glossary name'), 'तुलसी');
    await u.type(screen.getByLabelText('Note'), 'a herb');
    await u.click(within(table).getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(calls.find((c) => c.name === 'UpsertGlossaryTerm')?.variables).toEqual({
        input: { term: 'तुलसी', language: 'hi', note: 'a herb' },
      }),
    );
    expect(await within(table).findByText('तुलसी')).toBeInTheDocument();
    expect(screen.getByLabelText('New glossary name')).toHaveValue('');
  });

  it('shows how often a spelling was applied, with the lines it was applied to', async () => {
    const { client, calls } = fakeApi({
      ...quiet,
      Spellings: () => ({
        spellings: [
          spelling('spl_1', 'नीम', 'Neem', 2, [
            {
              recordingId: 'rec_1',
              segmentIndex: 4,
              before: 'नीम लीजिए',
              after: 'Neem lijiye',
              heardAt: new Date().toISOString(),
            },
          ]),
          spelling('spl_2', 'कल तक', 'by tomorrow', 0),
        ],
      }),
      UpsertSpelling: () => ({ upsertSpelling: spelling('spl_2', 'कल तक', 'by tomorrow', 0) }),
    });
    renderAt('/vocabulary', <App />, client);
    const section = (await screen.findByRole('heading', { name: 'Spellings' })).closest('section')!;
    expect(await within(section).findByLabelText('नीम applied 2 times')).toHaveTextContent('2');
    expect(within(section).getByText('phrase')).toBeInTheDocument();

    const u = userEvent.setup();
    await within(section).findByLabelText('कल तक on'); // the person is known: the controls are there
    await u.click(within(section).getByText('1 example'));
    const lines = within(section).getByRole('list', { name: 'Lines नीम was applied to' });
    expect(lines).toHaveTextContent('नीम लीजिए');
    expect(lines).toHaveTextContent('Neem lijiye');

    // Switching one off keeps everything else as it was.
    await u.click(within(section).getByLabelText('कल तक on'));
    await waitFor(() =>
      expect(calls.find((c) => c.name === 'UpsertSpelling')?.variables).toEqual({
        input: { id: 'spl_2', source: 'कल तक', target: 'by tomorrow', enabled: false },
      }),
    );
  });

  it('loads a CSV from a file and saves one', async () => {
    const { client, calls } = fakeApi({
      ...quiet,
      ImportGlossaryCsv: () => ({ importGlossaryCsv: { added: 2, updated: 1 } }),
      GlossaryCsv: () => ({ glossaryCsv: 'term,language,enabled,note,heard,last_heard_at\r\n' }),
    });
    renderAt('/vocabulary', <App />, client);
    const section = (await screen.findByRole('heading', { name: 'Glossary' })).closest('section')!;

    const u = userEvent.setup();
    const file = new File(['term,language\nनीम,hi\nतुलसी,hi\n'], 'glossary.csv', { type: 'text/csv' });
    await u.upload(await within(section).findByLabelText('Import glossary CSV'), file);
    await waitFor(() =>
      expect(calls.find((c) => c.name === 'ImportGlossaryCsv')?.variables).toEqual({
        csv: 'term,language\nनीम,hi\nतुलसी,hi\n',
      }),
    );
    expect(await within(section).findByRole('status')).toHaveTextContent('2 added, 1 updated.');

    await u.click(within(section).getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(saveTextFile).toHaveBeenCalledWith(
        'glossary.csv',
        'term,language,enabled,note,heard,last_heard_at\r\n',
        'text/csv',
      ),
    );
  });

  it('a viewer reads but cannot change anything', async () => {
    const { client } = fakeApi({
      ...quiet,
      Me: () => ({ me: { ...person, role: 'viewer' } }),
      Glossary: () => ({ glossary: [term('gls_1', 'नीम', 3)] }),
    });
    renderAt('/vocabulary', <App />, client);
    const section = (await screen.findByRole('heading', { name: 'Glossary' })).closest('section')!;
    expect(await within(section).findByText('नीम')).toBeInTheDocument();
    expect(within(section).queryByLabelText('New glossary name')).not.toBeInTheDocument();
    expect(within(section).queryByLabelText('Import glossary CSV')).not.toBeInTheDocument();
    expect(within(section).queryByRole('button', { name: 'Remove नीम' })).not.toBeInTheDocument();
    expect(within(section).getByLabelText('नीम on')).toBeDisabled();
    expect(within(section).getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
  });
});
