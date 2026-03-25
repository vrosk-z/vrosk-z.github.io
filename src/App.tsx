import { About } from './components/About';
import { Hero } from './components/Hero';
import { MatrixRain } from './components/MatrixRain';
import { Nav } from './components/Nav';
import { Services } from './components/Services';
import { Skills } from './components/Skills';
import { Tools } from './components/Tools';
import { useLanguage } from './hooks/useLanguage';
import { footerShell, mainGrid } from './lib/layout';

export default function App() {
  const { t } = useLanguage();

  return (
    <>
      <MatrixRain />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_48%)]"
      />
      <Nav />
      <main className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="flex-1">
          <Hero />
          <div className={mainGrid}>
            <About />
            <Skills />
            <div className="flex flex-col gap-8">
              <Services />
              <Tools />
            </div>
          </div>
        </div>
        <footer className="mt-auto border-t border-border/60">
          <div className={footerShell}>
            {t.footer.label}
          </div>
        </footer>
      </main>
    </>
  );
}
