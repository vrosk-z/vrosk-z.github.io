import { useEffect, useRef } from 'react';
import { useMatrixToggle } from '../hooks/useMatrixToggle';

const GLYPHS = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>[]{}/?#*&$'.split('');
const FONT_STACK = '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
const DESKTOP_FPS = 10;
const LOW_POWER_FPS = 6;
const PALETTE = ['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#3f3f46'];

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isLowPowerDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowCores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;

  return lowCores || lowMemory || window.innerWidth < 768;
}

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { enabled } = useMatrixToggle();

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    const lowPower = isLowPowerDevice();
    const fontSize = lowPower ? 18 : 16;
    const columnWidth = lowPower ? fontSize * 1.35 : fontSize * 1.08;
    const frameDuration = 1000 / (lowPower ? LOW_POWER_FPS : DESKTOP_FPS);
    const glyphCache = new Map<string, HTMLCanvasElement>();
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    let trails: number[] = [];
    let animationFrame = 0;
    let lastFrame = 0;

    const buildGlyphCache = () => {
      for (const glyph of GLYPHS) {
        PALETTE.forEach((color, index) => {
          const offscreen = document.createElement('canvas');
          offscreen.width = fontSize;
          offscreen.height = fontSize;
          const offscreenContext = offscreen.getContext('2d');

          if (!offscreenContext) {
            return;
          }

          offscreenContext.font = `${index === 0 ? '600' : '500'} ${fontSize}px ${FONT_STACK}`;
          offscreenContext.textAlign = 'center';
          offscreenContext.textBaseline = 'middle';
          offscreenContext.fillStyle = color;

          if (index === 0) {
            offscreenContext.shadowBlur = 6;
            offscreenContext.shadowColor = color;
          }

          offscreenContext.fillText(glyph, fontSize / 2, fontSize / 2 + 1);
          glyphCache.set(`${glyph}-${index}`, offscreen);
        });
      }
    };

    const resetColumns = () => {
      columns = Math.ceil(canvas.width / columnWidth);
      drops = Array.from({ length: columns }, () => Math.random() * -40);
      speeds = Array.from({ length: columns }, () => (lowPower ? 0.22 : 0.25) + Math.random() * 0.32);
      trails = Array.from({ length: columns }, () => (lowPower ? 5 : 7) + Math.floor(Math.random() * (lowPower ? 4 : 10)));
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resetColumns();
      }, 150);
    };

    const draw = (timestamp: number) => {
      animationFrame = window.requestAnimationFrame(draw);
      if (document.hidden || timestamp - lastFrame < frameDuration) {
        return;
      }

      lastFrame = timestamp;
      context.fillStyle = lowPower ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.16)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
        const head = Math.floor(drops[columnIndex]);

        for (let trailIndex = 0; trailIndex < trails[columnIndex]; trailIndex += 1) {
          const row = head - trailIndex;
          if (row < 0) {
            continue;
          }

          const glyph = GLYPHS[(columnIndex + row + trailIndex) % GLYPHS.length] ?? '0';
          const paletteIndex = Math.min(trailIndex, PALETTE.length - 1);
          const cachedGlyph = glyphCache.get(`${glyph}-${paletteIndex}`);

          if (cachedGlyph) {
            context.drawImage(cachedGlyph, columnIndex * columnWidth, row * fontSize);
          }
        }

        drops[columnIndex] += speeds[columnIndex];
        if (drops[columnIndex] * fontSize > canvas.height && Math.random() > 0.985) {
          drops[columnIndex] = Math.random() * -20;
        }
      }
    };

    buildGlyphCache();
    resize();
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      clearTimeout(resizeTimer);
      glyphCache.clear();
    };
  }, [enabled]);

  if (!enabled || prefersReducedMotion()) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.28] will-change-transform"
    />
  );
}
