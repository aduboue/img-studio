import * as React from 'react'
import { IconButton, Typography, Box, Menu, MenuItem, Avatar } from '@mui/material'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedIconButtonOpen } from './components/Button-SX'

import theme from 'app/theme'
const palette = theme.palette

import FormInputDropdown from './components/InputDropdown'
import FormInputChipGroup from './components/InputChipGroup'
import { FormInputGenerateSettingsI } from './components/InputInterface'
import { FormInputTextSmall } from './components/InputTextSmall'
import { Settings } from '@mui/icons-material'
import CustomTooltip from './components/Tooltip'

const CustomizedMenu = {
  '& .MuiPaper-root': {
    background: 'white',
    color: palette.text.primary,
    boxShadow: 5,
    p: 0.5,
    width: 250,
    '& .MuiMenuItem-root': {
      background: 'transparent',
      pb: 1,
    },
  },
}

export default function FormInputGenerateSettings({
  control,
  setValue,
  generalSettingsFields,
  advancedSettingsFields,
}: FormInputGenerateSettingsI) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <CustomTooltip title="Open settings" size="small">
        <IconButton onClick={handleClick} sx={{ px: 0.4, pr: 0.2 }}>
          <Avatar sx={{ ...CustomizedAvatarButton, ...(open === true && CustomizedIconButtonOpen) }}>
            <Settings
              sx={{
                ...CustomizedIconButton,
                ...(open === true && CustomizedIconButtonOpen),
              }}
            />
          </Avatar>
        </IconButton>
      </CustomTooltip>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={open}
        onClose={handleClose}
        sx={CustomizedMenu}
      >
        {Object.entries(generalSettingsFields).map(function ([param, field]) {
          return (
            <MenuItem key={param}>
              <FormInputChipGroup
                name={param}
                label={field.label}
                key={param}
                control={control}
                setValue={setValue}
                width="260px"
                mandatory={true}
                field={field}
                required={true}
              />
            </MenuItem>
          )
        })}

        {Object.entries(advancedSettingsFields).map(function ([param, field]) {
          return (
            <MenuItem key={param}>
              <FormInputDropdown
                name={param}
                label={field.label}
                key={param}
                control={control}
                field={field}
                styleSize="small"
                width="150px"
                required={true}
              />
            </MenuItem>
          )
        })}
        <MenuItem key={'negativePrompt'}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignContent: 'flex-start',
              width: '100%',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: palette.text.primary,
                fontSize: '0.75rem',
                fontWeight: 500,
                lineHeight: '1.3em',
                pb: 0.5,
              }}
            >
              {'Negative prompt (content to avoid)'}
            </Typography>

            <FormInputTextSmall name="negativePrompt" label="negativePrompt" control={control} required={false} />
          </Box>
        </MenuItem>
      </Menu>
    </>
  )
}
