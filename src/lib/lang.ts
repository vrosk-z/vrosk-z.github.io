import dictEn from '../content/en.json';
import dictRu from '../content/ru.json';

export type Language = 'en' | 'ru';
export type Content = typeof dictEn;

export function getLanguage(): Language {
  if (typeof document === 'undefined') return 'en';
  return document.documentElement.lang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function getContent(): Content {
  return getLanguage() === 'ru' ? dictRu : dictEn;
}
