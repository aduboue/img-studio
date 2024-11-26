import React from 'react'
import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { FormTextInputI } from './InputInterface'

export const FormInputTextSmall = ({ name, control }: FormTextInputI) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TextField
          onChange={onChange}
          value={value}
          helperText={error ? error.message : null}
          error={!!error}
          fullWidth
          required
          multiline
          rows={2}
          sx={{ '& .MuiInputBase-root': { p: 1, fontSize: '0.9rem' } }}
        />
      )}
    />
  )
}
