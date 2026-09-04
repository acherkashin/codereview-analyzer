import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { IconButton, Tooltip } from '@mui/material';
import { useColorMode } from '../theme/ColorModeProvider';

export function ColorModeToggle() {
  const { mode, setPreference } = useColorMode();
  const nextMode = mode === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${nextMode} theme`;

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() => setPreference(nextMode)}
        sx={{
          color: 'text.primary',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 1,
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'primary.main',
          },
        }}
      >
        {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
