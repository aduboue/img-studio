import React from 'react'
import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { FormTextInputInterface } from './FormInputInterface'

export const FormInputText = ({ name, control, label, required }: FormTextInputInterface) => {
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
          required
          multiline
          rows={4}
          sx={{ fontSize: '4rem' }}
        />
      )}
    />
  )
}
