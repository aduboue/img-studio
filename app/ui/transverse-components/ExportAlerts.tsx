import React from 'react'
import { Alert, Box, Button, IconButton } from '@mui/material'
import theme from '../../theme'
import { ArrowForwardIos, Close } from '@mui/icons-material'
const { palette } = theme

export const CloseWithoutSubmitWarning = ({ onClose, onKeepOpen }: { onClose: any; onKeepOpen: any }) => {
  return (
    <Alert
      severity="warning"
      sx={{
        height: 'auto',
        mb: 2,
        fontSize: '1rem',
        fontWeight: 500,
        pt: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'left',
        color: palette.warning.dark,
      }}
      icon={false}
      variant="outlined"
    >
      {'Are you sure you want to exit now ?'}
      <Box sx={{ display: 'flex', alignContent: 'center' }}>
        <Button
          color="inherit"
          size="small"
          onClick={onKeepOpen}
          sx={{
            fontSize: '1rem',
            fontWeight: 400,
            color: palette.text.secondary,
            width: 130,
            '&:hover': { background: 'transparent', color: palette.warning.dark, fontWeight: 500 },
          }}
        >
          <ArrowForwardIos sx={{ fontSize: '0.8rem', p: 0, mt: 0.2, mr: 0.5 }} />
          {'No, stay here'}
        </Button>
        <Button
          color="inherit"
          size="small"
          onClick={onClose}
          sx={{
            fontSize: '1rem',
            fontWeight: 400,
            color: palette.text.disabled,
            '&:hover': { background: 'transparent', color: palette.warning.dark, fontWeight: 400 },
          }}
        >
          <Close sx={{ fontSize: '0.8rem', p: 0, mt: 0.2, mr: 0.5 }} />
          {'Yes, close without exporting'}
        </Button>
      </Box>
    </Alert>
  )
}

export const ExportErrorWarning = ({ onClose, errorMsg }: { onClose: any; errorMsg: string }) => {
  return (
    <Alert
      severity="error"
      action={
        <IconButton aria-label="close" color="inherit" size="small" onClick={onClose} sx={{ pt: 0.2 }}>
          <Close fontSize="inherit" />
        </IconButton>
      }
      sx={{ height: 'auto', mb: 2, fontSize: 16, fontWeight: 500, pt: 1, color: palette.text.secondary }}
    >
      {errorMsg}
    </Alert>
  )
}
