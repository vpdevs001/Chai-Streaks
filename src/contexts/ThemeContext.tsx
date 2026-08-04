import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, THEME_REGISTRY, type ColorScheme, type ThemeColors } from '../theme';
import { getTheme, setTheme, type AppTheme } from '../db/preferences';

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: ThemeColors;
  preference: AppTheme;
  setPreference: (p: AppTheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useColorScheme() ?? 'dark') as ColorScheme;
  const [preference, setPreferenceState] = useState<AppTheme>('system');

  useEffect(() => {
    getTheme().then(setPreferenceState);
  }, []);

  const resolvedTheme = preference === 'system' ? systemScheme : preference;

  // Dark/light resolution comes from the registry's `isDark` flag — null means
  // "follow the OS" (only the 'system' pseudo-theme uses that).
  const metaIsDark = THEME_REGISTRY[preference]?.isDark ?? null;
  const isDark = metaIsDark ?? systemScheme === 'dark';

  const scheme: ColorScheme = isDark ? 'dark' : 'light';
  const colors = Colors[resolvedTheme] || Colors.dark;

  const handleSetPreference = async (p: AppTheme) => {
    setPreferenceState(p);
    await setTheme(p);
  };

  return (
    <ThemeContext.Provider
      value={{ scheme, colors, preference, setPreference: handleSetPreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
