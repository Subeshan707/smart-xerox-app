import React from 'react';
import { useColorScheme } from '@mui/material/styles';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <IconButton sx={{ visibility: 'hidden' }}><LightModeIcon /></IconButton>;
  }

  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleMode = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
    
    // Fallback to force Tailwind update if MUI's attribute is delayed
    if (newMode === 'dark') {
      document.documentElement.setAttribute('data-mui-color-scheme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.setAttribute('data-mui-color-scheme', 'light');
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <IconButton 
        onClick={toggleMode}
        color="inherit"
        sx={{ mr: 1 }}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
