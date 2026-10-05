# likho-mfe-vocabulary

The vocabulary app of the Likho web app: the glossary the speech model listens for and the
Hinglish spellings, with how often each one is heard in the calls, and CSV in and out. Loaded by
[likho-web-shell](https://github.com/likho-ai/likho-web-shell) at `/vocabulary` through Module
Federation; this repository exposes `./App`. Everyone sees it; members and admins change it.

React 19, Vite 8, Tailwind CSS v4 with the likho-ui tokens, likho-web-sdk.

## What it does

- **Glossary:** product and person names the model listens for, in the script of the audio; a
  name with several words is a phrase and reaches the model as one hotword. Each name shows how
  many transcript lines contained it and when the last one was heard (counted by likho-language
  from the lines the workers publish), the names heard most first. Switch a name off without
  losing it; a note says what it is.
- **Spellings:** heard as (Devanagari) → written as (Hinglish), word or phrase. Each shows how
  many lines it was applied to, when, and the last few of those lines as before/after examples.
- **CSV:** export either table (with the counts) and import one. The first line names the
  columns: `term, language, enabled, note` for the glossary, `source, target, enabled` for
  spellings; an entry already there is updated.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:5177/mfe/vocabulary/ on its own, against the gateway's API
```

In the product the shell loads `/mfe/vocabulary/remoteEntry.js`; `pnpm dev` here plus `pnpm dev`
in the shell gives the real layout through http://localhost:8080/vocabulary.

## Develop

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build
docker build -t likho-mfe-vocabulary .    # nginx serving the built files under /mfe/vocabulary/
```

Settings: `.env.development`, `.env.staging`, `.env.production` (Vite modes). The stylesheet is
scoped under `[data-mfe="vocabulary"]` (see `vite.config.ts`), so its classes never affect the
shell.
