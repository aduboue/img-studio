// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use client'
import { createTheme } from '@mui/material/styles'

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
      light: '#E8EAED',
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
      textTransform: 'none',
    },
    h1: {
      fontSize: '5rem',
      fontWeight: 400,
      lineHeight: 0.8,
    },
    h2: {
      fontSize: '3.5rem',
      fontWeight: 400,
      lineHeight: 0.8,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 400,
    },
    body1: {
      fontSize: '1.1rem',
      fontWeight: 400,
      lineHeight: 1.16,
    },
    body2: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.16,
    },
    subtitle1: {
      fontSize: '0.9rem',
      fontWeight: 400,
      lineHeight: 1.3,
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
        disableRipple: true,
      },
    },
  },
})

export default theme
