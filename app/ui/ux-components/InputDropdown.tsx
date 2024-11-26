import * as React from 'react'
import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { FormDropdownInputI } from './InputInterface'

import { TextField, MenuItem, FormControl } from '@mui/material'

import theme from '../../theme'
import CustomTooltip from './Tooltip'
const { palette } = theme

const CustomizedInput = (styleSize: string) => {
  var style = { color: palette.primary.main }
  if (styleSize === 'big') {
    style = { ...style, ...{ fontWeight: 700, fontSize: '2.5rem', pr: 2 } }
  }
  if (styleSize === 'small') {
    style = { ...style, ...{ fontWeight: 400, fontSize: '1rem', pr: 0.5 } }
  }

  return style
}

const CustomizedTextField = (styleSize: string, width: string) => {
  var customizedFont
  var customizedWidth = {}
  if (styleSize === 'big') {
    customizedFont = '37px'
  }
  if (styleSize === 'small') {
    ;(customizedFont = '24px'), (customizedWidth = { width: width })
  }

  return {
    ...{
      '& .MuiSvgIcon-root': {
        color: palette.text.secondary,
        fontSize: customizedFont,
      },
    },
    ...customizedWidth,
  }
}

const CustomizedSelected = {
  background: 'transparent',
  color: palette.primary.main,
  fontWeight: 500,
  '&:hover &:active': { background: 'transparent' },
}

const CustomizedMenu = {
  sx: {
    '& .MuiPaper-root': {
      background: 'white',
      color: palette.text.primary,
      boxShadow: 1,
      '& .MuiMenu-list': {
        pt: 0.5,
        pb: 1,
        background: 'transparent',
      },
      '& .MuiMenuItem-root': {
        background: 'transparent',
        py: 0.5,
        '&:hover': {
          fontWeight: 500,
          pl: 2.5,
        },
        '&.Mui-selected': CustomizedSelected,
      },
    },
  },
}

const CustomizedMenuItem = {
  '&.Mui-selected': CustomizedSelected,
}

export default function FormInputDropdown({
  styleSize,
  width,
  name,
  control,
  label,
  field,
  required,
}: FormDropdownInputI) {
  const [selectedItem, setSelectedItem] = useState(String)
  const [itemIndication, setItemIndication] = useState(String)

  const handleClick = (value: string, indication: string | undefined) => {
    setSelectedItem(value)
    setItemIndication(indication !== undefined ? indication : '')
  }

  return (
    <CustomTooltip title={itemIndication == null ? '' : itemIndication} size="big">
      <FormControl size={'small'}>
        <Controller
          render={({ field: { onChange, value } }) => (
            <TextField
              onChange={onChange}
              value={value == null ? field.default : value}
              select
              variant="standard"
              size="small"
              defaultValue={field.default}
              label={label == null ? '' : label}
              InputLabelProps={{
                sx: { color: palette.text.primary, fontWeight: 500, fontSize: '1rem' },
              }}
              InputProps={{ sx: CustomizedInput(styleSize) }}
              SelectProps={{ MenuProps: CustomizedMenu, displayEmpty: true }}
              sx={CustomizedTextField(styleSize, width)}
              required={required}
            >
              {field.options.map((field: { value: string; label: string; indication?: string }) => {
                return (
                  <MenuItem
                    onClick={() => handleClick(field.value, field.indication)}
                    key={field.value}
                    value={field.value}
                    selected={selectedItem === field.value}
                    sx={CustomizedMenuItem}
                  >
                    {field.label}
                  </MenuItem>
                )
              })}
            </TextField>
          )}
          control={control}
          name={name}
          rules={{ required: required }}
        />
      </FormControl>
    </CustomTooltip>
  )
}
