import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const KEY = 'cc-facility-theme';
const MODES = ['auto', 'light', 'dark'];

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getInitial() {
  const stored = localStorage.getItem(KEY);
  if (stored && MODES.includes(stored)) return stored;
  return 'auto';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitial);
  const dark = mode === 'dark' || (mode === 'auto' && getSystemDark());

  useEffect(() => {
    localStorage.setItem(KEY, mode);
    document.body.classList.toggle('bp6-dark', dark);
  }, [mode, dark]);

  useEffect(() => {
    if (mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.body.classList.toggle('bp6-dark', mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((prev) => {
      const i = MODES.indexOf(prev);
      return MODES[(i + 1) % MODES.length];
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, dark, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
