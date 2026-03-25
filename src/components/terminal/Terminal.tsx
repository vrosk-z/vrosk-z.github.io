import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useMatrixToggle } from '../../hooks/useMatrixToggle';
import { executePipeline } from './executor';
import { tokenize } from './lexer';
import { parse } from './parser';
import { plainText, type RichOutput, type RichSpan, type VFSNode } from './vfs-types';
import { VirtualFS } from './vfs';
import './commands';

const COMMANDS = [
  'help', 'whoami', 'pwd', 'ls', 'cat', 'cd', 'grep', 'find', 'head', 'tail', 'wc',
  'mkdir', 'touch', 'rm', 'echo', 'date', 'uptime', 'uname', 'hostname', 'id', 'history',
  'neofetch', 'fastfetch', 'screenfetch', 'fetch', 'about', 'skills', 'projects', 'contact',
  'matrix', 'lang', 'clear', 'curl', 'wget', 'ping', 'ssh', 'man', 'vim', 'nano', 'git',
  'python', 'python3', 'node', 'top', 'htop', 'kill', 'shutdown', 'reboot', 'exit', 'sudo',
  'cls', 'dir', 'type', 'll',
];

type HistoryEntry =
  | { type: 'input'; prompt: string; text: string }
  | { type: 'output'; output: RichOutput };

function resolveAlias(input: string) {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  const [head, ...rest] = trimmed.split(/\s+/);
  const aliasMap: Record<string, string> = {
    cls: 'clear',
    dir: 'ls',
    type: 'cat',
    ll: 'ls -la',
  };

  const resolved = aliasMap[head];
  return resolved ? [resolved, ...rest].join(' ') : trimmed;
}

function buildPrompt(vfs: VirtualFS) {
  return `vrosk@vroskOS:${vfs.promptPath()}$ `;
}

function spanClass(cls?: RichSpan['cls']) {
  switch (cls) {
    case 'dir':
      return 'text-white font-semibold';
    case 'exec':
      return 'text-green-400';
    case 'hidden':
      return 'text-zinc-600';
    case 'error':
      return 'text-red-400';
    case 'highlight':
      return 'bg-yellow-900/50 text-yellow-200';
    case 'muted':
      return 'text-zinc-500';
    default:
      return '';
  }
}

function RichOutputView({ output }: { output: RichOutput }) {
  return (
    <>
      {output.map((line, index) => (
        <div key={index} className="leading-relaxed">
          {line.map((span, spanIndex) => (
            <span key={spanIndex} className={spanClass(span.cls)}>
              {span.text}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

function pathCandidates(vfs: VirtualFS, fragment: string) {
  const lastSlash = fragment.lastIndexOf('/');
  const dirPart = lastSlash >= 0 ? fragment.slice(0, lastSlash + 1) : '';
  const namePart = lastSlash >= 0 ? fragment.slice(lastSlash + 1) : fragment;
  const listTarget = dirPart === ''
    ? '.'
    : dirPart === '/'
      ? '/'
      : dirPart.replace(/\/$/, '');
  const listed = vfs.ls(listTarget, true);

  if (!Array.isArray(listed)) {
    return [];
  }

  return listed
    .filter((node) => node.name.startsWith(namePart))
    .map((node: VFSNode) => `${dirPart}${node.name}${node.kind === 'dir' ? '/' : ''}`);
}

export function Terminal({ onDestroy }: { onDestroy: () => void }) {
  const { setLang, t } = useLanguage();
  const { setEnabled } = useMatrixToggle();
  const vfsRef = useRef(new VirtualFS());
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', output: plainText(t.terminal.welcome) },
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

  const execute = (value: string) => {
    try {
      const tokens = tokenize(resolveAlias(value));
      const pipeline = parse(tokens);
      return executePipeline(pipeline, vfsRef.current);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        output: message.split('\n').map((line) => [{ text: line, cls: 'error' as const }]),
        stdout: '',
        stderr: message,
        exitCode: 1,
      };
    }
  };

  const pushHistory = (prompt: string, text: string, output: RichOutput) => {
    setHistory((current) => [
      ...current,
      { type: 'input', prompt, text },
      ...(output.length > 0 ? [{ type: 'output' as const, output }] : []),
    ]);
  };

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const prompt = buildPrompt(vfsRef.current);
    const result = execute(trimmed);

    if (result.action === 'clear') {
      setHistory([]);
    } else if (result.action === 'history') {
      const output = plainText(
        commandHistory.map((command, index) => `  ${index + 1}  ${command}`).join('\n') || '(empty)',
      );
      pushHistory(prompt, trimmed, output);
    } else if (result.action === 'matrix-on') {
      setEnabled(true);
      pushHistory(prompt, trimmed, result.output);
    } else if (result.action === 'matrix-off') {
      setEnabled(false);
      pushHistory(prompt, trimmed, result.output);
    } else if (result.action === 'lang-en') {
      setLang('en');
      pushHistory(prompt, trimmed, result.output);
    } else if (result.action === 'lang-ru') {
      setLang('ru');
      pushHistory(prompt, trimmed, result.output);
    } else if (result.action === 'destroy') {
      pushHistory(prompt, trimmed, result.output);
      onDestroy();
    } else {
      pushHistory(prompt, trimmed, result.output);
    }

    setCommandHistory((current) => [...current, trimmed]);
    setHistoryIndex(null);
    setDraftInput('');
    setInput('');
    setTabMatches([]);
    setTabIndex(0);
    setTabPrefix('');
  };

  const completeInput = () => {
    if (tabMatches.length > 1) {
      const nextIndex = (tabIndex + 1) % tabMatches.length;
      setTabIndex(nextIndex);
      const parts = tabPrefix.split(' ');
      parts[parts.length - 1] = tabMatches[nextIndex] ?? '';
      setInput(parts.join(' '));
      return;
    }

    const current = input;
    const parts = current.split(' ');
    const isCommand = parts.length <= 1;
    const fragment = parts[parts.length - 1] ?? '';
    const candidates = isCommand
      ? COMMANDS.filter((command) => command.startsWith(fragment))
      : pathCandidates(vfsRef.current, fragment);

    if (candidates.length === 0) {
      return;
    }

    if (candidates.length === 1) {
      parts[parts.length - 1] = candidates[0] ?? '';
      setInput(`${parts.join(' ')}${isCommand ? ' ' : ''}`);
      setTabMatches([]);
      setTabIndex(0);
      setTabPrefix('');
      return;
    }

    setTabMatches(candidates);
    setTabIndex(0);
    setTabPrefix(current);
    parts[parts.length - 1] = candidates[0] ?? '';
    setInput(parts.join(' '));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      completeInput();
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
      className="flex h-[400px] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-border/90 bg-surface/85 shadow-[0_0_40px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur"
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
        {history.map((entry, index) => (
          <div key={index} className="whitespace-pre-wrap break-words">
            {entry.type === 'input' ? (
              <span className="text-accent">
                <span className="mr-2 text-text-muted">{entry.prompt}</span>
                {entry.text}
              </span>
            ) : (
              <RichOutputView output={entry.output} />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center border-t border-border/80 px-4 py-3 text-sm">
        <span className="mr-3 text-text-muted">{buildPrompt(vfsRef.current)}</span>
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
