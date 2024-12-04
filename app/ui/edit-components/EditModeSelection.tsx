import * as React from 'react'

import { EditImageFormFields } from '@/app/api/edit-utils'
import { Icon, Typography, Tooltip, Button, Grid2 as Grid, Stack, Collapse } from '@mui/material'

import theme from '../../theme'
const { palette } = theme

const CustomizedButtonBase = {
  py: 0.25,
  px: 1,
  '&:hover': {
    bgcolor: palette.action.hover,
    fontWeight: 700,
  },
  '& .MuiListItemIcon-root': {
    position: 'relative',
    left: 7,
    bottom: 2,
    minWidth: 45,
    px: 0,
    color: palette.secondary.main,
  },
  '& .MuiListitemText-root': {
    '& .MuiTypography-root': {
      fontWeight: 700,
    },
  },
}

const CustomizedPrimaryText = {
  fontSize: '1rem',
  textAlign: 'start',
  fontWeight: 500,
}
const CustomizedSecondaryText = {
  fontSize: '0.75rem',
  textAlign: 'start',
  color: palette.text.secondary,
}

const editModeField = EditImageFormFields.editMode
const editModeOptions = editModeField.options

//TODO update interface editMode
export default function EditModeSelection({
  handleNewEditMode,
  selectedEditMode,
}: {
  handleNewEditMode: any
  selectedEditMode: any
}) {
  const handleMenuItemClick = (value: string) => {
    handleNewEditMode(value)
  }

  return (
    <Stack gap={2} sx={{ width: '100%', height: '85px' }}>
      <Typography
        variant="caption"
        sx={{
          color: palette.text.primary,
          fontSize: '0.9rem',
          fontWeight: 500,
          lineHeight: '1.3em',
        }}
      >
        {editModeField.label}
      </Typography>
      <Grid container columnGap={2}>
        {editModeOptions.map((option) => (
          <Grid key={option.value} size={selectedEditMode?.value === option.value ? 'auto' : 'grow'}>
            <Tooltip
              title={
                selectedEditMode?.value !== option.value ? (
                  <Typography fontSize="0.8rem">{option.description}</Typography>
                ) : (
                  ''
                )
              }
              placement="bottom"
            >
              <Button
                key={option.label}
                size="small"
                startIcon={<Icon sx={{ color: palette.secondary.main }}>{option.icon}</Icon>}
                onClick={() => handleMenuItemClick(option.value)}
                sx={{
                  bgcolor: selectedEditMode?.value === option.value ? palette.action.selected : 'white',
                  ...CustomizedButtonBase,
                }}
              >
                <Stack>
                  <Typography sx={CustomizedPrimaryText}>{option.label}</Typography>
                  <Collapse
                    in={selectedEditMode.value === option.value}
                    timeout={selectedEditMode.value === option.value ? 400 : 75}
                    orientation="horizontal"
                    unmountOnExit
                  >
                    <Typography sx={CustomizedSecondaryText} noWrap>
                      {option.description}
                    </Typography>
                  </Collapse>
                </Stack>
              </Button>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
