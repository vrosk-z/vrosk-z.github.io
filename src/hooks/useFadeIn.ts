import { useEffect, useRef } from 'react';

export function useFadeIn<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || animated.current) return;

    // If element is already in viewport — show instantly, no animation
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      animated.current = true;
      return;
    }

    // Otherwise — hide and animate on scroll
    el.classList.add('opacity-0');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !animated.current) {
          animated.current = true;
          el.classList.remove('opacity-0');
          el.classList.add('animate-fade-in');
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
