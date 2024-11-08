import * as React from 'react'
import { IconButton, Typography, Box, Menu, MenuItem, Avatar } from '@mui/material'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedIconButtonOpen } from '../ux-components/Button-SX'

import theme from '../../theme'
const { palette } = theme

import FormInputDropdown from '../ux-components/InputDropdown'
import FormInputChipGroup from '../ux-components/InputChipGroup'
import { EditSettingsFieldsI } from '../../api/edit-utils'
import { FormInputTextSmall } from '../ux-components/InputTextSmall'
import { Settings } from '@mui/icons-material'
import CustomTooltip from '../ux-components/Tooltip'
import { FormInputSlider } from '../ux-components/InputSlider'

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

export default function FormInputEditSettings({
  control,
  setValue,
  editSettingsFields,
}: {
  control: any
  setValue: any
  editSettingsFields: EditSettingsFieldsI
}) {
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
        <IconButton onClick={handleClick} disableRipple sx={{ px: 0.4, pr: 0.2 }}>
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
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={open}
        onClose={handleClose}
        sx={CustomizedMenu}
      >
        <MenuItem key={editSettingsFields.sampleCount.label}>
          <FormInputChipGroup
            name={'sampleCount'}
            label={editSettingsFields.sampleCount.label ?? ''}
            key={'sampleCount'}
            control={control}
            setValue={setValue}
            width="260px"
            mandatory={true}
            field={editSettingsFields.sampleCount as any}
            required={true}
          />
        </MenuItem>

        <MenuItem key={editSettingsFields.maskDilation.label} sx={{ py: 0, pt: 1 }}>
          <FormInputSlider
            name="maskDilation"
            control={control}
            field={editSettingsFields.maskDilation as any}
            required={true}
          />
        </MenuItem>

        <MenuItem key={editSettingsFields.guidanceScale.label} sx={{ py: 0 }}>
          <FormInputSlider
            name="guidanceScale"
            control={control}
            field={editSettingsFields.guidanceScale as any}
            required={true}
          />
        </MenuItem>

        <MenuItem key={editSettingsFields.outputOptions.label}>
          <FormInputDropdown
            name="outputOptions"
            label={editSettingsFields.outputOptions.label}
            key={editSettingsFields.outputOptions.label}
            control={control}
            field={editSettingsFields.outputOptions as any}
            styleSize="small"
            width="150px"
            required={true}
          />
        </MenuItem>

        <MenuItem key={editSettingsFields.personGeneration.label}>
          <FormInputDropdown
            name="personGeneration"
            label={editSettingsFields.personGeneration.label}
            key={editSettingsFields.personGeneration.label}
            control={control}
            field={editSettingsFields.personGeneration as any}
            styleSize="small"
            width="150px"
            required={true}
          />
        </MenuItem>

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

            <FormInputTextSmall
              name="negativePrompt"
              label="negativePrompt"
              control={control}
              required={false}
              rows={3}
            />
          </Box>
        </MenuItem>
      </Menu>
    </>
  )
}
