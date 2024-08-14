'use client';
import { createTheme } from '@mui/material/styles';


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4285F4',
      dark: '#1967D2',
      light: '#AECBFA',
    },
    secondary: {
      main: '#5F6368',
      dark: '#202124',
      light: '#E8EAED'
    },
    text: {
      primary: '#202124',
      secondary: '#3C4043',
      disabled: '#5F6368',
    },
    background: {
      paper: '#202124',
      default: '#ffffff',
    },
    error: {
      main: '#D93025',
      dark: '#B31412',
      light: '#EE675C',
    },
    info: {
      main: '#1A73E8',
      light: '#669DF6',
      dark: '#185ABC',
    },
    success: {
      main: '#1E8E3E',
      light: '#5BB974',
      dark: '#137333',
    },
    warning: {
      main: '#F29900',
      light: '#FBBC04',
      dark: '#E37400',
    },
  },
  typography: {
    fontFamily: 'Roboto',
    fontSize: 20,
    button: {
      textTransform: 'none'
    },
    h1: {
      fontSize: '9rem',
      fontWeight: 600,
      lineHeight: 0.8,
    },
    h2: {
      fontSize: '5rem',
      fontWeight: 400,
      lineHeight: 0.8,
    },
    h3: {
      fontSize: '3.5rem',
      fontWeight: 100,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.65,
    },
    body2: {
      fontSize: '1.1rem',
      fontWeight: 400,
      lineHeight: 1.16,
    },
    caption: {
      fontSize: '0.6rem',
      fontWeight: 500,
      lineHeight: 1,
    },
  },
  shape: {
    borderRadius: 5,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      },
    },
  },
});

export default theme;
