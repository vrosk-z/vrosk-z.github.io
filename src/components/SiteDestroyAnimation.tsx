import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export function SiteDestroyAnimation({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<'deleting' | 'done'>('deleting');

  useEffect(() => {
    let timeoutId: number | undefined;
    let index = 0;

    const intervalId = window.setInterval(() => {
      const nextPath = t.terminal.destroy.paths[index];

      if (nextPath) {
        setLines((current) => [...current, `rm: deleting '${nextPath}'`]);
        index += 1;
        return;
      }

      window.clearInterval(intervalId);
      setPhase('done');
      timeoutId = window.setTimeout(onComplete, 3000);
    }, 200);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [onComplete, t.terminal.destroy.paths]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-black/95 p-6">
        {phase === 'deleting' ? (
          <div className="space-y-2">
            <p className="text-sm text-red-400">{t.terminal.destroy.command}</p>
            {lines.map((line) => (
              <p key={line} className="text-sm text-text-muted">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-2xl text-accent">{t.terminal.destroy.done}</p>
            <p className="text-sm text-text-muted">{t.terminal.destroy.reload}</p>
          </div>
        )}
      </div>
    </div>
  );
}
