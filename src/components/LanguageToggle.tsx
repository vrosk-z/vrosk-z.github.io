import { useLanguage } from '../hooks/useLanguage';

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      aria-label="Toggle language"
      className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-muted transition hover:text-accent"
      type="button"
      onClick={toggleLang}
    >
      {lang === 'en' ? 'RU' : 'EN'}
    </button>
  );
}
