import React from 'react'
import { Controller } from 'react-hook-form'
import { Box, Slider, TextField, Typography } from '@mui/material'
import { FormTextInputI } from './InputInterface'
import theme from '../../theme'
import { EditImageFieldStyleI } from '@/app/api/edit-utils'
const { palette } = theme

export const CustomSlider = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: any
  min: number
  max: number
  step: number
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography
        variant="caption"
        sx={{
          color: palette.text.primary,
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: '1.3em',
          pr: 1.5,
        }}
      >
        {label}
      </Typography>
      <Slider
        value={typeof value === 'number' ? value : 0}
        aria-labelledby="input-slider"
        onChange={onChange}
        size="small"
        min={min}
        max={max}
        step={step}
        sx={{
          color: palette.primary.main,
          width: 50,
          boxShadow: 0,
          '& .MuiSlider-thumb': {
            backgroundColor: palette.primary.main,
            boxShadow: '0 0 2px 0px rgba(0, 0, 0, 0.1)',
            '&:focus, &:hover, &.Mui-active': {
              boxShadow: '0px 0px 3px 1px rgba(0, 0, 0, 0.1)',
            },
            '&:before': {
              boxShadow:
                '0px 0px 1px 0px rgba(0,0,0,0.2), 0px 0px 0px 0px rgba(0,0,0,0.14), 0px 0px 1px 0px rgba(0,0,0,0.12)',
            },
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          color: palette.primary.main,
          fontSize: '0.75rem',
          fontWeight: 700,
          lineHeight: '1.3em',
          pl: 1.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

export const FormInputSlider = ({
  name,
  control,
  field,
  required,
}: {
  name: string
  control: any
  field: EditImageFieldStyleI
  required: boolean
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required }}
      defaultValue={field.default}
      render={({ field: { onChange, value } }) => (
        <CustomSlider
          label={field.label}
          value={value}
          onChange={onChange}
          min={field.min ?? 0}
          max={field.max ?? 1}
          step={field.step ?? 0.1}
        />
      )}
    />
  )
}
