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

import React from 'react'
import { Box, Fade, Tooltip } from '@mui/material'
import theme from '../../theme'
const { palette } = theme

const CustomizedSmallTooltip = {
  sx: {
    '& .MuiTooltip-tooltip': {
      backgroundColor: 'transparent',
      color: palette.text.primary,
      width: 85,
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 0.9,
      pt: 1,
      textAlign: 'center',
    },
  },
  modifiers: [
    {
      name: 'offset',
      options: { offset: [1, -35] },
    },
  ],
}

const CustomizedSmallWhiteTooltip = {
  sx: {
    '& .MuiTooltip-tooltip': {
      backgroundColor: 'white',
      color: palette.text.primary,
      width: 80,
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 0.9,
      textAlign: 'center',
    },
  },
  modifiers: [
    {
      name: 'offset',
      options: { offset: [1, -17] },
    },
  ],
}

const CustomizedBigTooltip = {
  sx: {
    '& .MuiTooltip-tooltip': {
      backgroundColor: 'transparent',
      color: palette.text.primary,
    },
  },
  modifiers: [
    {
      name: 'offset',
      options: { offset: [-10, -25] },
    },
  ],
}

export default function CustomTooltip({
  children,
  title,
  size,
}: {
  children: React.ReactElement
  title: string
  size: string
}) {
  const [open, setOpen] = React.useState(false)

  const handleTooltipOpen = () => {
    setOpen(true)
  }

  const handleTooltipClose = () => {
    setOpen(false)
  }

  return (
    <Tooltip
      title={title}
      open={open}
      placement={size === 'small' ? 'bottom' : size === 'big' ? 'top-start' : 'top'}
      disableInteractive
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 600 }}
      slotProps={{
        popper: { ...(size === 'small' && CustomizedSmallTooltip), ...(size === 'big' && CustomizedBigTooltip) },
      }}
    >
      <Box
        onMouseEnter={handleTooltipOpen}
        onMouseLeave={handleTooltipClose}
        onClick={handleTooltipClose}
        sx={{ display: 'flex' }}
      >
        {children ? children : null}
      </Box>
    </Tooltip>
  )
}

export function CustomWhiteTooltip({
  children,
  title,
  size,
}: {
  children: React.ReactElement
  title: string
  size: string
}) {
  const [open, setOpen] = React.useState(false)

  const handleTooltipOpen = () => {
    setOpen(true)
  }

  const handleTooltipClose = () => {
    setOpen(false)
  }

  return (
    <Tooltip
      title={title}
      open={open}
      placement={'bottom'}
      disableInteractive
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 600 }}
      slotProps={{
        popper: { ...CustomizedSmallWhiteTooltip },
      }}
    >
      <Box
        onMouseEnter={handleTooltipOpen}
        onMouseLeave={handleTooltipClose}
        onClick={handleTooltipClose}
        sx={{ display: 'flex' }}
      >
        {children ? children : null}
      </Box>
    </Tooltip>
  )
}
