import React from 'react'
import { Controller } from 'react-hook-form'
import { Chip, Stack, Box, Typography } from '@mui/material'

import theme from '../../theme'
const { palette } = theme

import { FormChipGroupMultipleInputI } from './InputInterface'

const CustomizedChip = {
  fontSize: '0.9rem',
  mb: 0.2,
  border: 1,
  borderColor: palette.secondary.light,
  '&:hover': {
    borderColor: palette.primary.main,
    bgcolor: palette.primary.main,
    transition: 'none',
    color: palette.text.primary,
    fontWeight: 500,
  },
  '&:active': {
    boxShadow: 0,
  },
  '&.MuiChip-filled': {
    color: 'white',
  },
}

export default function FormInputChipGroupMultiple({
  name,
  label,
  control,
  width,
  setValue,
  options,
  required,
}: FormChipGroupMultipleInputI) {
  const handleChipClick = (clickedValue: string, value: string[]) => {
    const newValue = value.includes(clickedValue)
      ? required && value.length === 1 // Prevent removal if required and it's the last item
        ? value
        : value.filter((v) => v !== clickedValue)
      : [...value, clickedValue]

    setValue(name, newValue)
  }

  return (
    <Controller
      name={name}
      control={control}
      key={name}
      rules={{
        required: required,
        validate: (value) => value.length > 0 || 'At least one chip must be selected', // Ensure at least one is selected
      }}
      render={({ field: { onChange, value = [] } }) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignContent: 'flex-start',
            width: width,
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
            {label + (required ? ' *' : '')}
          </Typography>

          <Stack
            direction="row"
            spacing={0}
            sx={{
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
            }}
          >
            {options &&
              options.map((chip) => (
                <Chip
                  key={chip.value}
                  label={chip.label}
                  size="small"
                  component={'button'}
                  onClick={() => handleChipClick(chip.value, value)} // Simplified onClick
                  onChange={onChange} // Keep this for react-hook-form integration
                  variant={value.includes(chip.value) ? 'filled' : 'outlined'} // Check if in selected values
                  color={value.includes(chip.value) ? 'primary' : 'secondary'}
                  sx={CustomizedChip}
                />
              ))}
          </Stack>
        </Box>
      )}
    />
  )
}
