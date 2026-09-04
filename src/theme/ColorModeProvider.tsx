import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, useMediaQuery } from '@mui/material';
import { PaletteMode, ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './index';

export type ColorModePreference = 'system' | PaletteMode;
interface ColorModeContextValue {
  mode: PaletteMode;
  preference: ColorModePreference;
  setPreference: (value: ColorModePreference) => void;
}
const storageKey = 'color-mode-preference';
const ColorModeContext = createContext<ColorModeContextValue | null>(null);

export function ColorModeProvider({ children }: PropsWithChildren) {
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [preference, setPreference] = useState<ColorModePreference>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });
  const mode: PaletteMode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  useEffect(() => localStorage.setItem(storageKey, preference), [preference]);

  return (
    <ColorModeContext.Provider value={{ mode, preference, setPreference }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (!context) throw new Error('useColorMode must be used within ColorModeProvider');
  return context;
}
