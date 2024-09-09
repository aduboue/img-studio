import * as React from 'react'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'

import theme from 'app/theme'
const palette = theme.palette

const sparkIcon = 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/spark/default/20px.svg'
const sparkOffIcon = 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/spark_off/default/20px.svg'

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 50,
  height: 31,
  padding: 8,
  border: 1,

  '&.MuiSwitch-root': {
    marginLeft: 0,
    left: 0,
  },

  '& .MuiSwitch-switchBase': {
    margin: 2.5,
    padding: 1,
    transform: 'translateX(4px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(15px)',
      '& .MuiSwitch-thumb': {
        border: 0,
        background: 'linear-gradient(90deg, rgba(33,123,254,0.9) 30%,  rgba(172,135,235,0.9) 90%)',
        '&:before': {
          backgroundImage: `url('${sparkIcon}')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          content: '""',
        },
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: palette.secondary.light,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    background: 'rgba(255,255,255,0.9)',
    border: `1px solid rgba(0, 0, 0, 0.3)`,
    boxShadow:
      '0px 2px 1px -1px rgba(0, 0, 0, 0.5), 0px 1px 1px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 0px rgba(0, 0, 0, 0.2)',
    '&:hover': {
      background: palette.primary.light,
      border: `1px solid rgba(0, 0, 0, 0)`,
    },
    width: 24,
    height: 24,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundImage: `url('${sparkOffIcon}')`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: palette.secondary.light,
    borderRadius: 20 / 2,
    width: '100%',
  },
}))

export const GeminiSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  return <MaterialUISwitch sx={{ mt: 2 }} checked={checked} onChange={onChange} />
}
