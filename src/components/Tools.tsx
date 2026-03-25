import { useFadeIn } from '../hooks/useFadeIn';
import { useLanguage } from '../hooks/useLanguage';
import { sectionCard, sectionKicker } from '../lib/layout';

export function Tools() {
  const { t } = useLanguage();
  const ref = useFadeIn<HTMLElement>();

  return (
    <section ref={ref} id="tools" className={sectionCard}>
      <p className={sectionKicker}># {t.tools.title}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {t.tools.items.map((tool) => {
          const cls =
            'rounded-md border border-border/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-text-muted transition';

          if (tool.url) {
            return (
              <a
                key={tool.name}
                className={`${cls} hover:border-accent/60 hover:text-accent`}
                href={tool.url}
                rel="noreferrer"
                target="_blank"
              >
                {tool.name}
              </a>
            );
          }

          return (
            <span key={tool.name} className={cls}>
              {tool.name}
            </span>
          );
        })}
      </div>
    </section>
  );
}
