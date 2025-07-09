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
import { IconButton, Typography, Box, Menu, MenuItem, Avatar } from '@mui/material'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedIconButtonOpen } from '../ux-components/Button-SX'

import theme from '../../theme'
const { palette } = theme

import FormInputDropdown from '../ux-components/InputDropdown'
import FormInputChipGroup from '../ux-components/InputChipGroup'
import { GenerateSettingsI } from '../ux-components/InputInterface'
import { FormInputTextSmall } from '../ux-components/InputTextSmall'
import { Settings } from '@mui/icons-material'
import CustomTooltip from '../ux-components/Tooltip'
import { FormInputNumberSmall } from '../ux-components/FormInputNumberSmall'

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

export default function GenerateSettings({
  control,
  setValue,
  generalSettingsFields,
  advancedSettingsFields,
  warningMessage,
}: GenerateSettingsI) {
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
        <IconButton onClick={handleClick} disableRipple sx={{ px: 0.5 }}>
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
        {warningMessage !== '' && (
          <Typography
            color={palette.warning.main}
            sx={{ m: 1, fontSize: '0.7rem', fontWeight: 400, fontStyle: 'italic', px: 1 }}
          >
            {warningMessage}
          </Typography>
        )}
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
                width="160px"
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

            <FormInputTextSmall
              rows={2}
              name="negativePrompt"
              label="negativePrompt"
              control={control}
              required={false}
            />
          </Box>
        </MenuItem>
        <MenuItem
          key={'seedNumber'}
          sx={{
            lineHeight: 0.8,
          }}
        >
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
                lineHeight: '1em',
                pb: 0,
              }}
            >
              {'Seed number (optional)'}
            </Typography>
            <Box sx={{ width: '90%', pb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  lineHeight: 0,

                  whiteSpace: 'normal',
                }}
              >
                {'A specific seed and prompt will always produce the same output'}
              </Typography>
            </Box>
            <FormInputNumberSmall name="seedNumber" control={control} min={1} max={2147483647} />
          </Box>
        </MenuItem>
      </Menu>
    </>
  )
}
