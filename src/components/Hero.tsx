import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { heroGrid, terminalShell } from '../lib/layout';
import { SiteDestroyAnimation } from './SiteDestroyAnimation';
import { Terminal } from './terminal';

function useTypingEffect(text: string, speed = 55, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (cancelRef.current) cancelRef.current();

    setDisplayed('');
    setDone(false);

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const typeNext = (i: number) => {
      if (cancelled) return;
      if (i > text.length) {
        setDone(true);
        return;
      }
      setDisplayed(text.slice(0, i));
      timer = setTimeout(() => typeNext(i + 1), speed + Math.random() * 35);
    };

    const startTimer = setTimeout(() => typeNext(0), startDelay);

    cancelRef.current = () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(timer);
    };

    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

export function Hero() {
  const { t } = useLanguage();
  const [destroying, setDestroying] = useState(false);
  const { displayed: typedTagline, done: typingDone } = useTypingEffect(t.hero.tagline, 38, 1600);

  return (
    <>
      <section
        id="top"
        className="relative flex min-h-[100dvh] items-center pb-16 pt-28 scroll-mt-24"
      >
        <div className={heroGrid}>
          <div className={`${terminalShell} space-y-6 text-left lg:max-w-none`}>
            <div className="space-y-4">
              <div className="flex items-end justify-start gap-3 sm:gap-4">
                <h1 className="text-[clamp(3rem,12vw,6rem)] font-semibold uppercase leading-none tracking-[0.06em] text-accent">
                  {t.hero.name}
                </h1>
                <span className="mb-1 text-sm uppercase tracking-[0.1em] text-text-muted/75 sm:mb-2 sm:text-base">
                  {t.hero.age}
                </span>
              </div>
              <p className="max-w-[560px] text-lg leading-relaxed text-text-muted sm:text-xl">
                <span className="mr-2 text-accent">&gt;</span>
                {typedTagline.length === 0 ? <span className="animate-blink-slow">...</span> : typedTagline}
                {typedTagline.length > 0 && (
                  <span className={`ml-0.5 inline-block w-[2px] h-[1.1em] align-middle bg-accent ${typingDone ? 'animate-blink' : ''}`} />
                )}
              </p>
            </div>

          </div>

          <div className={`flex justify-center lg:ml-auto lg:justify-end ${terminalShell}`}>
            <Terminal onDestroy={() => setDestroying(true)} />
          </div>
        </div>

        <a
          href="#about"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow text-text-muted/40 transition hover:text-text-muted/70"
          aria-label="Scroll down"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </a>
      </section>

      {destroying ? (
        <SiteDestroyAnimation
          onComplete={() => {
            window.location.reload();
          }}
        />
      ) : null}
    </>
  );
}
