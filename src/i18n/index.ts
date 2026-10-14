import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import pt from '../../i18n/pt.json';
import de from '../../i18n/de.json';
import ro from '../../i18n/ro.json';
import ru from '../../i18n/ru.json';
import fr from '../../i18n/fr.json';
import zh from '../../i18n/zh.json';
import ja from '../../i18n/ja.json';
import id from '../../i18n/id.json';

export const LANGUAGE_STORAGE_KEY = '@app_language_code';

export const dictionaries: Record<string, Record<string, string>> = {
  en,
  es,
  pt,
  de,
  ro,
  ru,
  fr,
  zh,
  ja,
  id,
};

let currentLang: string = 'en';
const listeners = new Set<(lang: string) => void>();

export const getLanguage = (): string => currentLang;

const notify = (): void => {
  listeners.forEach((listener) => listener(currentLang));
};

export const setLanguage = async (code: string): Promise<void> => {
  if (!dictionaries[code] || code === currentLang) {
    return;
  }
  currentLang = code;
  notify();
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // persistence is best-effort; in-memory switch already applied
  }
};

export const initLanguage = async (): Promise<void> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && dictionaries[saved] && saved !== currentLang) {
      currentLang = saved;
      notify();
    }
  } catch {
    // fall back to English
  }
};

export const subscribe = (listener: (lang: string) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  const dict = dictionaries[currentLang] || dictionaries.en;
  let text = dict[key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
};

export const useTranslation = (): {
  language: string;
  t: typeof t;
  setLanguage: (code: string) => Promise<void>;
} => {
  const language = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  return { language, t, setLanguage };
};
