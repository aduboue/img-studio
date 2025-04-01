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
import { useState } from 'react'

import { TextField, MenuItem, ListItemText, OutlinedInput, IconButton, Stack } from '@mui/material'

import theme from '../../theme'
import { semanticClasses } from '@/app/api/edit-utils'
import { Autorenew } from '@mui/icons-material'
const { palette } = theme

const CustomizedInput = { color: palette.primary.main, fontWeight: 400, fontSize: '1rem', pr: 0.5 }

const CustomizedTextField = (width: string) => {
  return {
    ...{
      '& .MuiSvgIcon-root': {
        color: palette.text.secondary,
        fontSize: '1.5rem',
      },
    },
    width: width,
    color: 'red',
  }
}

const CustomizedSelected = {
  background: 'transparent',
  color: palette.primary.main,
  fontWeight: 500,
  '&:hover &:active': {
    backgroundColor: palette.primary.dark,
  },
}

const CustomizedMenu = {
  sx: {
    transformOrigin: {
      vertical: 'top',
      horizontal: 'center',
    },
    '& .MuiPaper-root': {
      background: 'white',
      color: palette.text.primary,
      boxShadow: 1,
      height: 200,
      '& .MuiMenu-list': {
        pt: 0.5,
        pb: 1,
        background: 'transparent',
      },
      '& .MuiMenuItem-root': {
        background: 'transparent',
        py: 0.5,
        '&:hover': {
          fontWeight: 500,
          pl: 2.5,
        },
        '&.Mui-selected': CustomizedSelected,
      },
    },
  },
}

const CustomizedMenuItem = {
  '&.Mui-selected': CustomizedSelected,
}

export default function FormInputDropdownMultiple({
  width,
  label,
  selectedItems,
  handleSelect,
  handleReset,
}: {
  width: string
  label: string
  selectedItems: string[]
  handleSelect: any
  handleReset: any
}) {
  return (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        variant="outlined"
        size="small"
        SelectProps={{
          multiple: true,
          MenuProps: CustomizedMenu,
          displayEmpty: true,
          onChange: handleSelect,
          value: selectedItems,
          renderValue: (value: unknown) => {
            const selectedItems = value as string[]
            if (selectedItems.length === 0) return <>{label}</>
            else return selectedItems.join(', ')
          },
          input: <OutlinedInput sx={{ fontSize: '0.95rem', '& .MuiSelect-select': { pb: 0.5, pt: 0.7 } }} />,
        }}
        InputProps={{ sx: CustomizedInput }}
        sx={CustomizedTextField(width)}
      >
        {semanticClasses.map((option) => (
          <MenuItem key={option.value} value={option.value} sx={CustomizedMenuItem}>
            <ListItemText primary={option.value} />
          </MenuItem>
        ))}
      </TextField>
      <IconButton onClick={() => handleReset()} aria-label="Reset form" disableRipple sx={{ px: 0 }}>
        <Autorenew
          sx={{
            fontSize: '1.2rem',
            color: palette.text.secondary,
            p: 0,
            pb: 0.2,
            '&:hover': { color: palette.primary.main },
          }}
        />
      </IconButton>
    </Stack>
  )
}
