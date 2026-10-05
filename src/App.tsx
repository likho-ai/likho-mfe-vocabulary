/**
 * The vocabulary app: the glossary the speech model listens for and the Hinglish spellings, with
 * how often each one is heard, and CSV in and out. Exposed to the shell as ./App; mounted at
 * /vocabulary. Everyone sees it; members and admins change it.
 */
import { useMe } from '@likho-ai/web-sdk';
import { Glossary } from './components/Glossary';
import { Spellings } from './components/Spellings';
import './app.css';

export default function App() {
  const me = useMe();
  const canChange = me.data ? me.data.role !== 'viewer' : false;

  return (
    <div data-mfe="vocabulary" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vocabulary</h1>
        <p className="mt-1 max-w-2xl text-ink-2">
          Names the speech model listens for, and how words are written in Hinglish, with how often each one
          is heard in the calls. A new spelling rewrites a transcript&apos;s Hinglish from its saved
          Devanagari without running the model again (Transcript → Re-apply spellings).
        </p>
      </div>
      <Glossary canChange={canChange} />
      <Spellings canChange={canChange} />
    </div>
  );
}
