import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

type Phase = 'glitch' | 'deleting' | 'done';

export function SiteDestroyAnimation({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('glitch');
  const [glitchText, setGlitchText] = useState('');
  const [scanline, setScanline] = useState(0);
  const [doneVisible, setDoneVisible] = useState(false);
  const cancelRef = useRef(false);

  // Glitch chars for scramble effect
  const GLITCH = '!@#$%^&*<>[]{}\\|/01';

  useEffect(() => {
    cancelRef.current = false;

    // Phase 1: glitch screen flash (600ms)
    let glitchInterval: ReturnType<typeof setInterval>;
    let i = 0;
    const cmd = t.terminal.destroy.command;

    glitchInterval = setInterval(() => {
      if (cancelRef.current) { clearInterval(glitchInterval); return; }
      const scrambled = cmd.split('').map((ch) =>
        Math.random() > 0.6 ? GLITCH[Math.floor(Math.random() * GLITCH.length)] : ch
      ).join('');
      setGlitchText(scrambled);
      i++;
      if (i > 8) {
        clearInterval(glitchInterval);
        setGlitchText(cmd);
        setPhase('deleting');
      }
    }, 70);

    return () => {
      cancelRef.current = true;
      clearInterval(glitchInterval);
    };
  }, [t.terminal.destroy.command]);

  // Scanline animation
  useEffect(() => {
    const id = setInterval(() => {
      setScanline((v) => (v + 1) % 100);
    }, 16);
    return () => clearInterval(id);
  }, []);

  // Phase 2: deletion lines
  useEffect(() => {
    if (phase !== 'deleting') return;

    let index = 0;
    const paths = t.terminal.destroy.paths;

    const id = setInterval(() => {
      if (cancelRef.current) { clearInterval(id); return; }
      const nextPath = paths[index];
      if (nextPath) {
        setLines((cur) => [...cur, nextPath]);
        index++;
      } else {
        clearInterval(id);
        setTimeout(() => {
          if (!cancelRef.current) {
            setPhase('done');
            setTimeout(() => setDoneVisible(true), 100);
            setTimeout(() => { if (!cancelRef.current) onComplete(); }, 3200);
          }
        }, 300);
      }
    }, 160);

    return () => clearInterval(id);
  }, [phase, t.terminal.destroy.paths, onComplete]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `linear-gradient(transparent ${scanline}%, rgba(255,255,255,0.015) ${scanline}%, rgba(255,255,255,0.015) ${scanline + 1}%, transparent ${scanline + 1}%)`,
        }}
      />
      {/* CRT vignette */}
      <div className="pointer-events-none absolute inset-0 z-10" style={{
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)',
      }} />

      <div className="relative z-20 flex h-full items-start justify-center px-6 pt-16">
        <div className="w-full max-w-2xl">
          {/* Command line */}
          <p
            className="mb-4 font-mono text-sm"
            style={{
              color: phase === 'glitch' ? '#ff3333' : '#cc2222',
              textShadow: phase === 'glitch' ? '0 0 12px #ff0000, 2px 0 #00ffff, -2px 0 #ff00ff' : '0 0 8px #ff000055',
            }}
          >
            $ {glitchText || t.terminal.destroy.command}
          </p>

          {/* Deletion log */}
          {phase !== 'done' && (
            <div className="space-y-0.5">
              {lines.map((line, idx) => (
                <p
                  key={idx}
                  className="font-mono text-xs"
                  style={{
                    color: idx === lines.length - 1 ? '#888' : '#333',
                    opacity: Math.max(0.15, 1 - (lines.length - 1 - idx) * 0.12),
                  }}
                >
                  <span className="text-red-800">rm:</span> removing '{line}'
                </p>
              ))}
              {lines.length > 0 && (
                <span
                  className="inline-block h-3.5 w-2 bg-red-600 align-middle"
                  style={{ animation: 'blink 0.5s step-end infinite' }}
                />
              )}
            </div>
          )}

          {/* Done phase */}
          {phase === 'done' && (
            <div
              className="mt-8 space-y-3"
              style={{
                opacity: doneVisible ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              <p
                className="font-mono text-3xl font-semibold tracking-wider text-white"
                style={{ textShadow: '0 0 20px rgba(255,255,255,0.4)' }}
              >
                {t.terminal.destroy.done}
              </p>
              <p className="font-mono text-sm text-zinc-500">
                {t.terminal.destroy.reload}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
