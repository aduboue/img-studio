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

import { Controller, Control } from 'react-hook-form'
import { FormControl, FormHelperText, Input, InputAdornment } from '@mui/material'
import theme from '../../theme' // Make sure this path is correct for your project structure

const { palette } = theme

interface FormInputNumberProps {
  name: string
  control: Control<any>
  width?: number
  adornment?: string
  min: number
  max: number
}

export const FormInputNumberSmall = ({ name, control, width = 75, min, max }: FormInputNumberProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl variant="standard" sx={{ width: width }} error={!!error}>
          <Input
            value={value || ''}
            onChange={(e) => {
              const numValue = parseInt(e.target.value, 10)
              onChange(isNaN(numValue) ? null : numValue)
            }}
            size="small"
            inputProps={{
              type: 'number',
              min,
              max,
              step: 1,
            }}
            sx={{
              '& .MuiInput-input': {
                padding: 0,
                width: '100%',
                color: palette.primary.main,
                fontWeight: 400,
              },
            }}
          />
        </FormControl>
      )}
    />
  )
}
