import { useLanguage } from '../hooks/useLanguage';
import { LanguageToggle } from './LanguageToggle';

const LINKS = ['about', 'skills', 'services'] as const;

export function Nav() {
  const { t } = useLanguage();

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
          vrosk
        </a>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] uppercase tracking-[0.22em] text-text-muted sm:gap-4">
          {LINKS.map((link) => (
            <a key={link} className="hidden sm:inline group whitespace-nowrap transition hover:text-accent" href={`#${link}`}>
              <span className="mr-0.5 opacity-0 transition-opacity group-hover:opacity-100">&gt;</span>
              {t.nav[link]}
            </a>
          ))}
          <a
            aria-label="Telegram"
            className="inline-flex h-3.5 w-3.5 items-center justify-center text-text-muted transition hover:text-accent"
            href={t.contact.url}
            rel="noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}
