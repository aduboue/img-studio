import React from 'react'
import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { FormTextInputI } from './InputInterface'
import theme from '../../theme'
const { palette } = theme

export const FormInputText = ({ name, control, label, required, rows }: FormTextInputI) => {
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
