import { createTheme, PaletteMode } from '@mui/material/styles';

export function createAppTheme(mode: PaletteMode) {
  const dark = mode === 'dark';
  const border = dark ? 'rgba(226,232,240,0.12)' : '#E4E8F0';

  return createTheme({
    breakpoints: { values: { xs: 0, sm: 600, md: 1000, lg: 1200, xl: 1920 } },
    palette: {
      mode,
      primary: {
        main: dark ? '#8B80FF' : '#5B4FE9',
        light: '#A79FFF',
        dark: '#4035C7',
        contrastText: dark ? '#0D1017' : '#FFFFFF',
      },
      secondary: { main: dark ? '#55D7B2' : '#0F9F7A' },
      success: { main: dark ? '#4FD1B5' : '#0E9F8C' },
      info: { main: dark ? '#62B4FF' : '#287DD1' },
      warning: { main: dark ? '#F7C66A' : '#B7791F' },
      error: { main: dark ? '#FF7B87' : '#D14355' },
      background: { default: dark ? '#0D1017' : '#F5F7FB', paper: dark ? '#151A24' : '#FFFFFF' },
      text: { primary: dark ? '#F3F5FA' : '#161927', secondary: dark ? '#AAB2C2' : '#667085' },
      divider: border,
      action: {
        active: dark ? '#B6BECD' : '#667085',
        hover: dark ? 'rgba(255,255,255,0.06)' : 'rgba(22,25,39,0.045)',
        selected: dark ? 'rgba(139,128,255,0.16)' : 'rgba(91,79,233,0.10)',
        focus: dark ? 'rgba(139,128,255,0.24)' : 'rgba(91,79,233,0.18)',
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      button: { fontWeight: 650, letterSpacing: '-0.01em' },
      body1: { fontSize: '1rem', lineHeight: 1.55 },
      body2: { fontSize: '0.875rem', lineHeight: 1.55 },
      subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
      overline: { fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.6, letterSpacing: '0.07em' },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      h1: { fontSize: '2.5rem', fontWeight: 750, lineHeight: 1.15, letterSpacing: '-0.035em' },
      h2: { fontSize: '2rem', fontWeight: 750, lineHeight: 1.2, letterSpacing: '-0.03em' },
      h3: { fontSize: '1.75rem', fontWeight: 750, lineHeight: 1.25, letterSpacing: '-0.025em' },
      h4: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em' },
      h5: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.35 },
      h6: { fontSize: '1.05rem', fontWeight: 650, lineHeight: 1.4 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { boxSizing: 'border-box' },
          html: { minHeight: '100%', colorScheme: mode },
          body: {
            minHeight: '100%',
            margin: 0,
            backgroundImage: dark
              ? 'radial-gradient(circle at 50% -20%, #20263A 0, transparent 42%)'
              : 'radial-gradient(circle at 50% -20%, #EEF0FF 0, transparent 42%)',
          },
          '#root': { minHeight: '100%' },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
          },
        },
      },
      MuiButtonBase: { defaultProps: { disableRipple: false } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: 10,
            paddingInline: 18,
            textTransform: 'none',
            transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
          },
        },
      },
      MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${border}`,
            boxShadow: dark ? '0 14px 34px rgba(0,0,0,0.20)' : '0 10px 28px rgba(32,39,64,0.06)',
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: 14 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { minHeight: 52, borderRadius: 10 },
          notchedOutline: { borderColor: dark ? 'rgba(226,232,240,0.18)' : '#DCE1EA' },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { color: dark ? '#AAB2C2' : '#667085' } } },
      MuiMenu: { defaultProps: { elevation: 8 }, styleOverrides: { paper: { marginTop: 8, border: `1px solid ${border}` } } },
      MuiDialog: { styleOverrides: { paper: { border: `1px solid ${border}` } } },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? '#1C2230' : '#F7F8FB',
            '& .MuiTableCell-root': {
              borderBottom: 'none',
              color: dark ? '#CBD2DE' : '#475467',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            },
          },
        },
      },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12, borderRadius: 8 } } },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            minHeight: 40,
            color: dark ? '#CBD2DE' : '#475467',
            '&.Mui-selected': {
              color: dark ? '#F3F5FA' : '#161927',
              backgroundColor: dark ? 'rgba(139,128,255,0.22)' : 'rgba(91,79,233,0.12)',
            },
          },
        },
      },
    },
  });
}
