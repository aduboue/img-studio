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
import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { FormTextInputI } from './InputInterface'
import theme from '../../theme'
const { palette } = theme

export const FormInputText = ({ name, control, label, required, rows, promptIndication }: FormTextInputI) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TextField
          onChange={onChange}
          value={value}
          label={label}
          helperText={error ? error.message : null}
          error={!!error}
          fullWidth
          required={required}
          multiline
          rows={rows}
          placeholder={promptIndication}
          sx={{
            fontSize: '4rem',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: palette.secondary.light,
              },
              '&:hover fieldset': {
                borderColor: palette.secondary.main,
              },
              '&.Mui-focused fieldset': {
                border: 1,
                borderColor: palette.primary.main,
              },
            },
          }}
        />
      )}
    />
  )
}
