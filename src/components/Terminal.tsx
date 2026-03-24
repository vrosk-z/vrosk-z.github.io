import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useMatrixToggle } from '../hooks/useMatrixToggle';
import { type CommandResult, executeCommand } from './TerminalCommands';
import { fs } from './VirtualFS';

const COMMANDS = [
  'help', 'whoami', 'pwd', 'ls', 'cat', 'cd', 'neofetch', 'fastfetch',
  'about', 'skills', 'projects', 'contact', 'matrix', 'lang', 'clear',
  'echo', 'date', 'uptime', 'uname', 'hostname', 'id', 'history',
  'rm', 'touch', 'mkdir', 'curl', 'wget', 'ping', 'ssh', 'man',
  'vim', 'nano', 'git', 'python', 'python3', 'node', 'top', 'htop',
  'kill', 'shutdown', 'reboot', 'exit', 'sudo',
];

interface HistoryLine {
  type: 'input' | 'output';
  text: string;
}

export function Terminal({ onDestroy }: { onDestroy: () => void }) {
  const { setLang, t } = useLanguage();
  const { setEnabled } = useMatrixToggle();
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'output', text: t.terminal.welcome },
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [draftInput, setDraftInput] = useState('');
  const [tabMatches, setTabMatches] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [tabPrefix, setTabPrefix] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [history]);

  const applyCommandAction = (trimmedInput: string, result: CommandResult) => {
    switch (result.action) {
      case 'clear':
        setHistory([]);
        return;
      case 'history': {
        const historyOutput = commandHistory
          .map((cmd, i) => `  ${i + 1}  ${cmd}`)
          .join('\n') || '(empty)';
        setHistory((current) => [
          ...current,
          { type: 'input' as const, text: trimmedInput },
          { type: 'output' as const, text: historyOutput },
        ]);
        return;
      }
      case 'matrix-on':
        setEnabled(true);
        break;
      case 'matrix-off':
        setEnabled(false);
        break;
      case 'lang-en':
        setLang('en');
        break;
      case 'lang-ru':
        setLang('ru');
        break;
      case 'destroy':
        onDestroy();
        return;
      default:
        break;
    }

    setHistory((current) => {
      const nextHistory = [...current, { type: 'input' as const, text: trimmedInput }];
      if (result.output) {
        nextHistory.push({ type: 'output' as const, text: result.output });
      }

      return nextHistory;
    });
  };

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const result = executeCommand(trimmed);
    applyCommandAction(trimmed, result);
    setCommandHistory((current) => [...current, trimmed]);
    setHistoryIndex(null);
    setDraftInput('');
    setInput('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();

      // If we already have matches from a previous Tab, cycle through them
      if (tabMatches.length > 1) {
        const nextIndex = (tabIndex + 1) % tabMatches.length;
        setTabIndex(nextIndex);
        const parts = tabPrefix.split(' ');
        parts[parts.length - 1] = tabMatches[nextIndex];
        setInput(parts.length <= 1 ? tabMatches[nextIndex] : parts.join(' '));
        return;
      }

      const current = input;
      const parts = current.split(' ');
      const isFirstWord = parts.length <= 1;

      let candidates: string[];
      let prefix: string;

      if (isFirstWord) {
        prefix = parts[0] ?? '';
        if (!prefix) return;
        candidates = COMMANDS.filter((cmd) => cmd.startsWith(prefix));
      } else {
        const argPrefix = parts[parts.length - 1] ?? '';
        candidates = fs.lsAll().filter((f) => f.startsWith(argPrefix));
        prefix = argPrefix;
      }

      if (candidates.length === 0) return;

      if (candidates.length === 1) {
        if (isFirstWord) {
          setInput(candidates[0] + ' ');
        } else {
          parts[parts.length - 1] = candidates[0];
          setInput(parts.join(' '));
        }
        setTabMatches([]);
        setTabIndex(0);
        setTabPrefix('');
      } else {
        // Multiple matches — start cycling
        setTabMatches(candidates);
        setTabIndex(0);
        setTabPrefix(current);
        if (isFirstWord) {
          setInput(candidates[0]);
        } else {
          parts[parts.length - 1] = candidates[0];
          setInput(parts.join(' '));
        }
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (commandHistory.length === 0) {
        return;
      }

      if (historyIndex === null) {
        setDraftInput(input);
        const nextIndex = commandHistory.length - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex] ?? '');
        return;
      }

      const nextIndex = Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex] ?? '');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === null) {
        return;
      }

      if (historyIndex >= commandHistory.length - 1) {
        setHistoryIndex(null);
        setInput(draftInput);
        return;
      }

      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex] ?? '');
    }
  };

  return (
    <div
      className="flex h-[400px] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-border/90 bg-surface/85 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur"
      onClick={() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          inputRef.current?.focus();
        }
      }}
    >
      <div className="relative flex items-center justify-center border-b border-border/80 px-4 py-3">
        <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
          {t.terminal.windowTitle}
        </span>
        <div className="absolute right-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        {history.map((line, index) => (
          <div key={`${line.type}-${index}`} className="whitespace-pre-wrap break-words">
            {line.type === 'input' ? (
              <span className="text-accent">
                <span className="mr-2 text-text-muted">$</span>
                {line.text}
              </span>
            ) : (
              <pre className="whitespace-pre-wrap break-words text-text-muted">{line.text}</pre>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center border-t border-border/80 px-4 py-3 text-sm">
        <span className="mr-3 text-text-muted">$</span>
        <input
          ref={inputRef}
          autoComplete="off"
          autoFocus
          className="flex-1 bg-transparent text-accent outline-none placeholder:text-text-muted/50"
          placeholder="help"
          spellCheck={false}
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (historyIndex !== null) {
              setHistoryIndex(null);
            }
            // Reset tab completion on manual typing
            if (tabMatches.length > 0) {
              setTabMatches([]);
              setTabIndex(0);
              setTabPrefix('');
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
