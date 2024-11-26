import React from 'react'
import { Controller } from 'react-hook-form'
import { Box, IconButton, TextField } from '@mui/material'
import theme from '../../theme'
import { Close, Height } from '@mui/icons-material'
const { palette } = theme

const customTextField = {
  width: '25vh',
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
}: {
  name: string
  value: string
  control: any
  label: string
  required: boolean
  disabled?: boolean
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
          value={value}
          disabled={disabled}
          variant="standard"
          multiline
          label={`${label} ${required ? '*' : ''}`}
          maxRows={3}
          size="small"
          InputLabelProps={{
            sx: {
              width: '100%',
              color: palette.text.primary,
              fontWeight: 500,
              fontSize: '1rem',
              '& .MuiInputLabel-root.Mui-disabled': { color: 'red' },
            },
          }}
          sx={customTextField}
        />
      )}
    />
  )
}
