'use client'

import * as React from 'react'
import { useForm, useWatch, Control } from 'react-hook-form'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SendIcon from '@mui/icons-material/Send'
import theme from 'app/theme'
import { useState } from 'react'
import { TextField, MenuItem, Button, Box, FormControl } from '@mui/material'

import { generateFields, chipGroupFieldsInterface } from './conf-files/generate-form-fields'
import { FormInputText } from './components/FormInputText'
import FormInputDropdown from './components/FormInputDropdown'
import FormInputChipGroup from './components/FormInputChipGroup'
import FormInputGenerateSettings from './components/FormInputGenerateSettings'
const modelField = generateFields.modelVersion
const generalSettingsFields = generateFields.generalSettings.fields
const advancedSettingsFields = generateFields.advancedSettings.fields
const imgStyleField = generateFields.style.fields.img_style
const subImgStyleFields = generateFields.style.fields.img_sub_style
const compositionFields = generateFields.composition.fields

const palette = theme.palette

const CustomizedSendButton = {
  borderRadius: 7,
  border: 1,
  borderColor: 'white',
  boxShadow: 0,
  my: 1.5,
  py: 0.5,
  px: 1.5,
  fontSize: '1rem',
  '&:hover': {
    background: 'white',
    color: palette.primary.main,
    border: 1,
    borderColor: palette.primary.main,
    boxShadow: 0,
  },
}

const CustomizedAccordion = {
  maxHeight: '430px',
  overflowY: 'scroll',
  bgcolor: 'transparent',
  boxShadow: 0,
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    borderRadius: 1,
    border: 1,
    borderWidth: 1,
    borderColor: palette.secondary.main,
    minHeight: 0,
    margin: 0,
  },
}

const CustomizedAccordionSummary = {
  backgroundColor: palette.background.paper,
  color: 'white',
  '&.Mui-expanded': {
    backgroundColor: 'white',
    color: palette.primary.main,
  },
}

interface formDataInterface {
  prompt: string
  model_version: string
  sampleCount: string
  aspectRatio: string
  personGeneration: string
  outputOptions: string
  img_style: string
  img_sub_style: string
  img_light: string
  img_light_origin: string
  img_view_angle: string
  img_perspective: string
  img_background: string
}

const formDataDefaults = {
  prompt: '',
  model_version: modelField.default,
  sampleCount: generalSettingsFields.sampleCount.default,
  aspectRatio: generalSettingsFields.aspectRatio.default,
  personGeneration: advancedSettingsFields.personGeneration.default,
  outputOptions: advancedSettingsFields.outputOptions.default,
  img_style: imgStyleField.default,
  img_sub_style: imgStyleField.defaultSub,
  img_light: '',
  img_light_origin: '',
  img_view_angle: '',
  img_perspective: '',
  img_background: '',
}

export default function GenerateForm() {
  const { handleSubmit, reset, control, setValue } = useForm<formDataInterface>({
    defaultValues: formDataDefaults,
  })

  const subImgStyleField = (control: Control<formDataInterface, any>) => {
    const currentPrimaryStyle: string = useWatch({ control, name: 'img_style' })
    const currentAssociatedSubId: string = imgStyleField.options.filter(
      (option) => option.value === currentPrimaryStyle
    )[0].subID

    const subImgStyleField: chipGroupFieldsInterface = subImgStyleFields.options.filter(
      (option) => option.subID === currentAssociatedSubId
    )[0]

    setValue('img_sub_style', '')

    return subImgStyleField
  }

  const onSubmit = (formData: formDataInterface) => {
    console.log(formData) // TODO Replace with your submission logic
  }

  return (
    <Box>
      <Box sx={{ pb: 5 }}>
        <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
          <Typography variant="h2" color={palette.text.secondary} sx={{ fontSize: '1.8rem' }}>
            {'Generating with'}
          </Typography>
          <FormInputDropdown
            name="model_version"
            label=""
            control={control}
            field={modelField}
            styleSize="big"
            width=""
            required={true}
          />
        </Stack>
      </Box>

      <FormInputText
        name="prompt"
        control={control}
        label="Prompt - What would you like to generate?"
        required={true}
      />

      <Stack justifyContent="flex-end" direction="row" gap={1.2} pb={3}>
        <FormInputGenerateSettings
          control={control}
          setValue={setValue}
          generalSettingsFields={generalSettingsFields}
          advancedSettingsFields={advancedSettingsFields}
        />
        <IconButton
          onClick={() => {
            reset(formDataDefaults)
          }}
          aria-label="Reset form"
          sx={{ p: 0 }}
        >
          <RestartAltIcon
            sx={{
              fontSize: '30px',
              '&:hover': {
                color: palette.primary.main,
                transform: 'rotate(-45deg)',
              },
            }}
          />
        </IconButton>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          endIcon={<SendIcon />}
          sx={CustomizedSendButton}
        >
          Send
        </Button>
      </Stack>
      <Accordion disableGutters sx={CustomizedAccordion} defaultExpanded>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={CustomizedAccordionSummary}
        >
          <Typography display="inline" variant="body2" sx={{ fontWeight: 500 }}>
            Customize Style & Composition
          </Typography>
          <Typography
            display="inline"
            variant="caption"
            sx={{ pl: 1, fontSize: '0.8rem', fontWeight: 400 }}
          >
            (optional)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="column" gap={2} pl={1.5}>
            <Box>
              <Stack
                direction="row"
                spacing={3}
                flexWrap="wrap"
                justifyContent="flex-start"
                alignItems="flex-start"
                sx={{ pt: 1, height: 100 }}
              >
                <FormInputDropdown
                  name="img_style"
                  label={imgStyleField.label}
                  control={control}
                  field={imgStyleField}
                  styleSize="small"
                  width="140px"
                  required={false}
                />
                <FormInputChipGroup
                  name="img_sub_style"
                  label={subImgStyleField(control).label}
                  control={control}
                  setValue={setValue}
                  width="400px"
                  mandatory={false}
                  field={subImgStyleField(control)}
                  required={false}
                />
              </Stack>
            </Box>
            <Box>
              <Stack
                direction="row"
                spacing={0}
                sx={{ flexWrap: 'wrap', justifyContent: 'flex-start' }}
              >
                {Object.entries(compositionFields).map(function ([param, field]) {
                  return (
                    <Box py={1} width="50%">
                      <FormInputChipGroup
                        name={param}
                        label={field.label}
                        key={param}
                        control={control}
                        setValue={setValue}
                        width="250px"
                        mandatory={false}
                        field={field}
                        required={false}
                      />
                    </Box>
                  )
                })}
              </Stack>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}
