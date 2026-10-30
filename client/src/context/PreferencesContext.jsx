import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages } from '../lib/messages.js';

const PreferencesContext = createContext(null);
const languages = ['ta', 'tanglish', 'en'];

function readPreference(key, fallback, allowed) {
  try {
    const value = window.localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => readPreference('mystery-language', 'en', languages));
  const [theme, setTheme] = useState(() => readPreference('mystery-theme', 'dark', ['dark', 'light']));

  useEffect(() => {
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en';
    try { window.localStorage.setItem('mystery-language', language); } catch { /* Storage can be unavailable in private browsing. */ }
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem('mystery-theme', theme); } catch { /* Storage can be unavailable in private browsing. */ }
  }, [theme]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    theme,
    setTheme,
    t: (key, values = {}) => Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      messages[language]?.[key] || messages.en[key] || key,
    ),
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider.');
  return context;
}
