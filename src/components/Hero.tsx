import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { SiteDestroyAnimation } from './SiteDestroyAnimation';
import { Terminal } from './Terminal';

export function Hero() {
  const { t } = useLanguage();
  const [destroying, setDestroying] = useState(false);

  return (
    <>
      <section
        id="top"
        className="relative flex min-h-screen items-center px-6 pb-16 pt-28 scroll-mt-24"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_560px] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                <h1 className="max-w-3xl text-6xl font-semibold uppercase tracking-[0.18em] text-accent sm:text-7xl">
                  {t.hero.name}
                </h1>
                <span className="mb-1.5 text-sm uppercase tracking-[0.3em] text-text-muted/75 sm:mb-2 sm:text-base">
                  {t.hero.age}
                </span>
                <a
                  aria-label="Telegram"
                  className="mb-1.5 inline-flex h-5 w-5 items-center justify-center text-text-muted/80 transition hover:text-accent sm:mb-2 sm:h-6 sm:w-6"
                  href={t.contact.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <svg aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-text-muted sm:text-xl">
                <span className="mr-2 text-accent">&gt;</span>
                {t.hero.tagline}
              </p>
            </div>

            <div className="lg:hidden">
              <p className="rounded-2xl border border-border/80 bg-surface/70 px-4 py-3 text-sm text-text-muted">
                {t.terminal.mobileHint}
              </p>
            </div>
          </div>

          <div className="hidden lg:block">
            <Terminal onDestroy={() => setDestroying(true)} />
          </div>
        </div>
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
