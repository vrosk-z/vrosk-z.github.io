import { useFadeIn } from '../hooks/useFadeIn';
import { useLanguage } from '../hooks/useLanguage';

export function Services() {
  const { t } = useLanguage();
  const ref = useFadeIn<HTMLElement>();

  return (
    <section
      ref={ref}
      id="services"
      className="section-panel scroll-mt-24 rounded-3xl border border-border/80 bg-surface/75 p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-text-muted"># {t.services.title}</p>
      <div className="mt-6 space-y-3 text-sm leading-7 text-text-muted">
        {t.services.items.map((item) => (
          <p key={item} className="font-mono transition-transform duration-150 hover:translate-x-1">
            <span className="mr-3 text-accent/80">//</span>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
