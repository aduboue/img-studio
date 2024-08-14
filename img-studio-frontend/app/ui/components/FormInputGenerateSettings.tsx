import * as React from 'react'
import { IconButton, FormControl, TextField, Typography, Box } from '@mui/material'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import theme from 'app/theme'
const palette = theme.palette

import { generateFields } from '../conf-files/generate-form-fields'
import FormInputDropdown from './FormInputDropdown'
import FormInputChipGroup from './FormInputChipGroup'
import { FormInputGenerateSettingsInterface } from './FormInputInterface'
import { FormInputTextSmall } from './FormInputTextSmall'

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
}: FormInputGenerateSettingsInterface) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  const CustomizedIconButton = {
    ...(open === true && {
      color: palette.primary.main,
      transform: 'rotate(45deg)',
    }),
    '&:hover': {
      color: palette.primary.main,
      transform: 'rotate(45deg)',
    },
    fontSize: '25px',
  }

  return (
    <>
      <IconButton onClick={handleClick} sx={{ p: 0, pr: 0.5 }}>
        <SettingsOutlinedIcon sx={CustomizedIconButton} />
      </IconButton>
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
            <MenuItem>
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
            <MenuItem>
              <FormInputDropdown
                name={param}
                label={field.label}
                key={param}
                control={control}
                field={field}
                styleSize="small"
                width="150px"
                required={false}
              />
            </MenuItem>
          )
        })}
        <MenuItem>
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
            />
          </Box>
        </MenuItem>
      </Menu>
    </>
  )
}
