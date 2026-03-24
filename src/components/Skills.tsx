import { useLanguage } from '../hooks/useLanguage';

const LEVEL_BARS: Record<string, string> = {
  primary: '[############--]',
  learning: '[######--------]',
  comfortable: '[##########----]',
  daily: '[##############]',
};

export function Skills() {
  const { t } = useLanguage();

  return (
    <section
      id="skills"
      className="section-panel scroll-mt-24 rounded-3xl border border-border/80 bg-surface/75 p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-text-muted"># {t.skills.title}</p>
      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3">
        {t.skills.items.map((skill) => (
          <div
            key={skill.name}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 rounded-2xl border border-border/70 bg-black/20 px-4 py-3"
          >
            <span className="text-sm text-accent text-left">{skill.name}</span>
            <span className="text-xs uppercase tracking-[0.18em] text-text-muted text-center">
              {LEVEL_BARS[skill.level] ?? '[##########--------]'}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-text-muted/80 text-right">
              {skill.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
