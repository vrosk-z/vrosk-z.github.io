import { useFadeIn } from '../hooks/useFadeIn';
import { useLanguage } from '../hooks/useLanguage';

export function About() {
  const { t } = useLanguage();
  const paragraphs = t.about.text.split('\n\n');
  const ref = useFadeIn<HTMLElement>();

  return (
    <section
      ref={ref}
      id="about"
      className="section-panel scroll-mt-24 rounded-3xl border border-border/80 bg-surface/75 p-6 lg:col-span-2 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-text-muted"># {t.about.title}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 24)}`} className="text-base leading-8 text-text-muted sm:text-lg">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
