import { experimental_extendTheme as extendTheme } from '@mui/material/styles';

const customerPalette = {
  primary: {
    main: '#0061A4',
    light: '#428FD8',
    dark: '#00497D',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#535F70',
    light: '#808D9F',
    dark: '#3A4656',
    contrastText: '#FFFFFF',
  },
  tertiary: {
    main: '#6B5778',
    light: '#9B85A8',
    dark: '#523F5D',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#FDFBFF',
    paper: '#F2F0F4',
  },
  primaryContainer: {
    main: '#D1E4FF',
  },
  onPrimaryContainer: {
    main: '#001D36',
  },
  surfaceContainer: {
    main: '#E1E2E4',
  },
};

const customerDarkPalette = {
  primary: {
    main: '#9ECAFF',
    light: '#D1E4FF',
    dark: '#00497D',
    contrastText: '#003258',
  },
  secondary: {
    main: '#BBC7DB',
    light: '#E2EEFF',
    dark: '#8C98AC',
    contrastText: '#253140',
  },
  tertiary: {
    main: '#D6BEE4',
    light: '#F8DEFC',
    dark: '#A68FB4',
    contrastText: '#3B2948',
  },
  background: {
    default: '#1A1C1E',
    paper: '#1E2022',
  },
  primaryContainer: {
    main: '#00497D',
  },
  onPrimaryContainer: {
    main: '#D1E4FF',
  },
  surfaceContainer: {
    main: '#2A2C2E',
  },
};

const operatorPalette = {
  primary: {
    main: '#006C4C',
    light: '#3EB285',
    dark: '#005138',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#4D6357',
    light: '#7A9184',
    dark: '#364B41',
    contrastText: '#FFFFFF',
  },
  tertiary: {
    main: '#3D6373',
    light: '#6B90A2',
    dark: '#274B5A',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#FBFDF9',
    paper: '#EFF1ED',
  },
  primaryContainer: {
    main: '#62FDC0',
  },
  onPrimaryContainer: {
    main: '#002114',
  },
  surfaceContainer: {
    main: '#E4E6E3',
  },
};

const operatorDarkPalette = {
  primary: {
    main: '#41E0A4',
    light: '#62FDC0',
    dark: '#005138',
    contrastText: '#003825',
  },
  secondary: {
    main: '#B3CCBE',
    light: '#DCECE3',
    dark: '#849C8F',
    contrastText: '#1A342A',
  },
  tertiary: {
    main: '#A3CCDF',
    light: '#CBEBFF',
    dark: '#749CB0',
    contrastText: '#073543',
  },
  background: {
    default: '#191C1A',
    paper: '#1D201E',
  },
  primaryContainer: {
    main: '#005138',
  },
  onPrimaryContainer: {
    main: '#62FDC0',
  },
  surfaceContainer: {
    main: '#2B2D2B',
  },
};

// Common options for typography and shape
const commonOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    displayLarge: { fontSize: '57px', lineHeight: '64px', fontWeight: 400 },
    displayMedium: { fontSize: '45px', lineHeight: '52px', fontWeight: 400 },
    headlineLarge: { fontSize: '32px', lineHeight: '40px', fontWeight: 400 },
    headlineMedium: { fontSize: '28px', lineHeight: '36px', fontWeight: 400 },
    titleLarge: { fontSize: '22px', lineHeight: '28px', fontWeight: 400 },
    titleMedium: { fontSize: '16px', lineHeight: '24px', fontWeight: 500 },
    bodyLarge: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    bodyMedium: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    labelLarge: { fontSize: '14px', lineHeight: '20px', fontWeight: 500 },
    labelMedium: { fontSize: '12px', lineHeight: '16px', fontWeight: 500 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // fully rounded for M3
          textTransform: 'none', // no uppercase
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Disable MUI v4/v5 elevation overlays for pure M3 surface colors
        },
      },
    },
  },
};

export const customerTheme = extendTheme({
  colorSchemeSelector: 'data-mui-color-scheme',
  colorSchemes: {
    light: {
      palette: customerPalette,
    },
    dark: {
      palette: customerDarkPalette,
    },
  },
  ...commonOptions,
});

export const operatorTheme = extendTheme({
  colorSchemeSelector: 'data-mui-color-scheme',
  colorSchemes: {
    light: {
      palette: operatorPalette,
    },
    dark: {
      palette: operatorDarkPalette,
    },
  },
  ...commonOptions,
});
