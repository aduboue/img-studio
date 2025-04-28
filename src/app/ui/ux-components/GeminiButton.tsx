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

import * as React from 'react'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import { Box, Icon, Switch } from '@mui/material'
import theme from '../../theme'
const { palette } = theme

export const sparkIcon = 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/spark/default/20px.svg'
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

export const GeminiButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <IconButton
      aria-label="close"
      color="inherit"
      size="small"
      disableRipple={true}
      onClick={onClick}
      sx={{
        p: 0,
        m: 0,
        width: 19,
        height: 19,
        backgroundImage: 'linear-gradient(90deg, rgba(33,123,254,0.9) 30%,  rgba(172,135,235,0.9) 90%)',
        '&:hover': {
          boxShadow:
            '0px 3px 2px -2px rgba(0, 0, 0, 0.5), 0px 1px 1px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 0px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <Icon
        color="primary"
        sx={{
          p: 0,
          m: 0,
          mb: 0.5,
          alignContent: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={sparkIcon} />
      </Icon>
    </IconButton>
  )
}
