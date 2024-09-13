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
