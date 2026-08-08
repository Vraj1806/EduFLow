import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeId = 'light' | 'dark' | 'lucid';
export type ThemePreference = ThemeId | 'system';

interface ThemeContextValue {
  /** The theme currently applied to the document (system resolves to light/dark). */
  theme: ThemeId;
  /** The user's stored preference — may be 'system'. */
  preference: ThemePreference;
  setTheme: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'eduflow-theme';

const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

function systemTheme(): ThemeId {
  try {
    return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

function isThemeId(value: string): value is ThemeId {
  return value === 'light' || value === 'dark' || value === 'lucid';
}

function isPreference(value: string): value is ThemePreference {
  return isThemeId(value) || value === 'system';
}

/** Read the persisted preference, migrating the legacy 'glass' theme to 'lucid'. */
function getInitialPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const migrated = stored === 'glass' ? 'lucid' : stored;
      if (isPreference(migrated)) return migrated;
    }
  } catch {
    // localStorage unavailable
  }
  return 'system';
}

function resolveTheme(preference: ThemePreference): ThemeId {
  return preference === 'system' ? systemTheme() : preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference);
  const [theme, setThemeState] = useState<ThemeId>(() => resolveTheme(getInitialPreference()));

  const applyTheme = useCallback((next: ThemeId, animate: boolean) => {
    const root = document.documentElement;
    if (animate) root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', next);
    if (animate) {
      window.setTimeout(() => root.classList.remove('theme-transitioning'), 300);
    }
  }, []);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      setPreference(next);
      const resolved = resolveTheme(next);
      setThemeState(resolved);
      applyTheme(resolved, true);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
    },
    [applyTheme],
  );

  useEffect(() => {
    applyTheme(theme, false);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mql = window.matchMedia(SYSTEM_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      const resolved = event.matches ? 'dark' : 'light';
      setThemeState(resolved);
      applyTheme(resolved, true);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [preference, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
