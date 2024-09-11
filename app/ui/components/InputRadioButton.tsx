import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { FormControlLabel, Radio, Typography } from '@mui/material'

import theme from '../../theme'
import { FormInputRadioButtonI } from './InputInterface'
const palette = theme.palette

export const CustomRadio = ({ label, subLabel, value, currentSelectedValue, enabled }: FormInputRadioButtonI) => {
  return (
    <FormControlLabel
      value={value}
      control={
        <Radio
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
      }
      label={
        <>
          <Typography
            sx={{
              fontSize: '1rem',
              fontStyle: value == '' || enabled ? 'normal' : 'italic',
              color:
                value == '' || enabled
                  ? currentSelectedValue === value
                    ? palette.primary.main
                    : palette.text.primary
                  : palette.text.disabled,
              '&:hover': { cursor: value == '' || enabled ? 'pointer' : 'no-drop' },
            }}
          >
            {label}
          </Typography>
          <Typography
            color={palette.secondary.main}
            sx={{
              fontSize: '0.8rem',
              fontStyle: value == '' || enabled ? 'normal' : 'italic',
              '&:hover': { cursor: value == '' || enabled ? 'pointer' : 'no-drop' },
            }}
          >
            {subLabel}
          </Typography>
        </>
      }
      disabled={!enabled}
    />
  )
}
