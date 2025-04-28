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

import React, { useEffect, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { Box, IconButton, TextField } from '@mui/material'
import theme from '../../theme'
import { Close, Height } from '@mui/icons-material'
const { palette } = theme

const customTextField = {
  '& .MuiInputBase-root': {
    fontSize: '1rem',
    color: palette.primary.main,
    lineHeight: '110%',
  },
}

export const FormInputTextLine = ({
  name,
  value,
  control,
  label,
  required,
  disabled,
  key,
}: {
  name: string
  value: string
  control: any
  label: string
  required: boolean
  disabled?: boolean
  key: string
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required }}
      disabled={disabled}
      render={({ field: { onChange } }) => (
        <TextField
          onChange={onChange}
          key={key}
          value={value}
          disabled={disabled}
          variant="standard"
          multiline
          label={`${label} ${required ? '*' : ''}`}
          maxRows={3}
          size="small"
          InputLabelProps={{
            sx: {
              color: palette.text.primary,
              fontWeight: 500,
              fontSize: '1rem',
            },
          }}
          sx={customTextField}
        />
      )}
    />
  )
}
