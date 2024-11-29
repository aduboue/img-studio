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
