import { useFadeIn } from '../hooks/useFadeIn';
import { useLanguage } from '../hooks/useLanguage';
import { sectionCard, sectionKicker } from '../lib/layout';

export function Services() {
  const { t } = useLanguage();
  const ref = useFadeIn<HTMLElement>();

  return (
    <section
      ref={ref}
      id="services"
      className={sectionCard}
    >
      <p className={sectionKicker}># {t.services.title}</p>
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
