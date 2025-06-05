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

const volumeOff = 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/volume_off/default/20px.svg'
const volumeOn = 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/volume_up/default/20px.svg'

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
      transform: 'translateX(15px)',
      '& .MuiSwitch-thumb': {
        border: 0,
        background: 'rgba(33,123,254,0.8)',
        '&:before': {
          backgroundImage: `url('${volumeOn}')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          content: '""',
          filter: 'invert(100%)',
        },
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: palette.secondary.light,
      },
    },
  },
  '& .MuiSwitch-thumb': {
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
      backgroundImage: `url('${volumeOff}')`,
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

export const AudioSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  return <MaterialUISwitch sx={{ mt: 2 }} checked={checked} onChange={onChange} />
}
