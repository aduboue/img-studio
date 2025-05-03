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

import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { FormControlLabel, Radio, RadioProps, Typography } from '@mui/material'

import theme from '../../theme'
import { FormInputRadioButtonI } from './InputInterface'
const { palette } = theme

export const CustomRadioButton = (props: RadioProps) => {
  return (
    <Radio
      {...props}
      size="small"
      checkedIcon={<CheckCircle sx={{ fontSize: '1.4rem' }} />}
      icon={<RadioButtonUnchecked sx={{ fontSize: '1.4rem' }} />}
      sx={{
        py: 1.5,
        '&:hover': {
          color: palette.primary.main,
          backgroundColor: 'transparent',
          cursor: 'pointer',
        },
      }}
    />
  )
}

export const CustomRadioLabel = (
  value: string,
  label: string,
  subLabel: string,
  currentSelectedValue: string,
  enabled: boolean
) => {
  return (
    <>
      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 400,
          color:
            value == '' || enabled
              ? currentSelectedValue === value
                ? palette.primary.main
                : palette.text.primary
              : palette.text.disabled,
          '&:hover': { cursor: value == 'no' || enabled ? 'pointer' : 'no-drop' },
        }}
      >
        {label}
      </Typography>
      <Typography
        color={palette.secondary.main}
        sx={{
          fontSize: '0.8rem',
          fontWeight: value == '' || enabled ? (currentSelectedValue === value ? 400 : 300) : 300,
          color:
            value == '' || enabled
              ? currentSelectedValue === value
                ? palette.text.primary
                : palette.text.secondary
              : palette.text.disabled,
          fontStyle: value == 'no' || enabled ? 'normal' : 'italic',
          '&:hover': { cursor: value == 'no' || enabled ? 'pointer' : 'no-drop' },
        }}
      >
        {subLabel}
      </Typography>
    </>
  )
}

export const CustomRadio = ({ label, subLabel, value, currentSelectedValue, enabled }: FormInputRadioButtonI) => {
  return (
    <FormControlLabel
      value={value}
      control={<CustomRadioButton />}
      label={CustomRadioLabel(value, label, subLabel, currentSelectedValue, enabled)}
      disabled={!enabled}
    />
  )
}
