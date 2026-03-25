import { useFadeIn } from '../hooks/useFadeIn';
import { useLanguage } from '../hooks/useLanguage';
import { sectionCard, sectionKicker } from '../lib/layout';

const LEVEL_BARS: Record<string, string> = {
  primary: '[############--]',
  learning: '[######--------]',
  comfortable: '[##########----]',
  daily: '[##############]',
};

export function Skills() {
  const { t } = useLanguage();
  const ref = useFadeIn<HTMLElement>();

  return (
    <section
      ref={ref}
      id="skills"
      className={sectionCard}
    >
      <p className={sectionKicker}># {t.skills.title}</p>
      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3">
        {t.skills.items.map((skill) => (
          <div
            key={skill.name}
            className="group grid gap-1 rounded-2xl border border-border/70 bg-black/20 px-4 py-3 text-center transition-colors duration-150 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-x-4 sm:text-left"
          >
            <span className="text-sm text-accent transition-colors duration-150 group-hover:text-white sm:text-left">{skill.name}</span>
            <span className="text-xs uppercase tracking-[0.18em] text-text-muted transition-colors duration-150 group-hover:text-white sm:text-center">
              {LEVEL_BARS[skill.level] ?? '[##########--------]'}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-text-muted/80 transition-colors duration-150 group-hover:text-white sm:text-right">
              {skill.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
