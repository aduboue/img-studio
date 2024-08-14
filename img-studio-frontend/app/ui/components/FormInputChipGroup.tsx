import React from 'react'
import { Controller } from 'react-hook-form'
import { Chip, Stack, Box, Typography, FormControl } from '@mui/material'

import theme from 'app/theme'
const palette = theme.palette

import { FormChipGroupInputInterface } from './FormInputInterface'

const CustomizedChip = {
  fontSize: '1rem',
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

export default function FormInputChipGroup({
  name,
  label,
  control,
  width,
  mandatory,
  setValue,
  field,
  required,
}: FormChipGroupInputInterface) {
  const handleChipClick = ({
    clickedValue,
    currentValue,
  }: {
    clickedValue: string
    currentValue: string
  }) => {
    mandatory
      ? setValue(name, clickedValue)
      : clickedValue !== currentValue
      ? setValue(name, clickedValue)
      : setValue(name, '')
  }

  return field !== undefined ? (
    <FormControl size={'small'}>
      <Controller
        name={name}
        control={control}
        key={name}
        rules={{ required: required }}
        render={({ field: { onChange, value } }) => (
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
              {label}
            </Typography>
            <Stack
              direction="row"
              spacing={0}
              sx={{
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
              }}
            >
              {field.options.map((chipValue) => (
                <Chip
                  key={chipValue}
                  label={chipValue}
                  size="small"
                  component={'button'}
                  onClick={() => handleChipClick({ clickedValue: chipValue, currentValue: value })}
                  onChange={onChange}
                  variant={value === chipValue ? 'filled' : 'outlined'}
                  color={value === chipValue ? 'primary' : 'secondary'}
                  sx={CustomizedChip}
                />
              ))}
            </Stack>
          </Box>
        )}
      />
    </FormControl>
  ) : null
}
