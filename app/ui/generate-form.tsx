'use client'

import * as React from 'react'
import { useForm, useWatch, Control, SubmitHandler } from 'react-hook-form'
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Box,
  IconButton,
  Stack,
  Alert,
  Avatar,
} from '@mui/material'
import {
  Send as SendIcon,
  WatchLater as WatchLaterIcon,
  ArrowDownward as ArrowDownwardIcon,
  Close as CloseIcon,
  Autorenew,
  Lightbulb,
} from '@mui/icons-material'

import { FormInputText } from './components/InputText'
import FormInputDropdown from './components/InputDropdown'
import FormInputChipGroup from './components/InputChipGroup'
import FormInputGenerateSettings from './generate-settings'

import {
  modelField,
  generalSettingsFields,
  advancedSettingsFields,
  imgStyleField,
  subImgStyleFields,
  compositionFields,
  GenerateImageFormI,
  formDataDefaults,
  formDataResetableFields,
  ImageI,
  RandomPrompts,
} from '../api/generate-utils'

import theme from '../theme'
import { generateImage } from '../api/imagen/action'
import { GeminiSwitch } from './components/GeminiSwitch'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from './components/Button-SX'
import { useEffect, useState } from 'react'
import CustomTooltip from './components/Tooltip'
import { CustomizedAccordion, CustomizedAccordionSummary } from './components/Accordion-SX'
import { useAppContext } from '../context/app-context'
const { palette } = theme

export default function GenerateForm({
  isLoading,
  onRequestSent,
  onImageGeneration,
  errorMsg,
  onNewErrorMsg,
}: {
  isLoading: boolean
  onRequestSent: (valid: boolean) => void
  onImageGeneration: (newImages: ImageI[]) => void
  errorMsg: string
  onNewErrorMsg: (newErrorMsg: string) => void
}) {
  const { handleSubmit, resetField, control, setValue, getValues } = useForm<GenerateImageFormI>({
    defaultValues: formDataDefaults,
  })
  const { appContext } = useAppContext()

  // Manage if prompt should be generated with Gemini
  const [isGeminiRewrite, setIsGeminiRewrite] = useState(true)
  const handleGeminiRewrite = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsGeminiRewrite(event.target.checked)
  }

  //TODO get from Gemini ideas
  const getRandomPrompt = () => {
    return RandomPrompts[Math.floor(Math.random() * RandomPrompts.length)]
  }

  useEffect(() => {
    if (appContext && appContext.promptToGenerate) setValue('prompt', appContext.promptToGenerate)
  }, [appContext?.promptToGenerate])

  const onSubmit: SubmitHandler<GenerateImageFormI> = async (formData: GenerateImageFormI) => {
    onRequestSent(true)

    try {
      const newGeneratedImages = await generateImage(formData, isGeminiRewrite, appContext)

      if (newGeneratedImages !== undefined && typeof newGeneratedImages === 'object' && 'error' in newGeneratedImages) {
        const errorMsg = newGeneratedImages['error'].replaceAll('Error: ', '')
        throw Error(errorMsg)
      } else {
        newGeneratedImages.map((image) => {
          if ('warning' in image) {
            onNewErrorMsg(image['warning'] as string)
          }
        })

        onImageGeneration(newGeneratedImages)
      }
    } catch (error: any) {
      onNewErrorMsg(error.toString())
    }
  }

  // Update Secondary style dropdown depending on picked primary style
  const subImgStyleField = (control: Control<GenerateImageFormI, any>) => {
    const currentPrimaryStyle: string = useWatch({ control, name: 'style' })

    var currentAssociatedSubId = imgStyleField.defaultSub
    if (currentPrimaryStyle !== '') {
      currentAssociatedSubId = imgStyleField.options.filter((option) => option.value === currentPrimaryStyle)[0].subID
    }

    const subImgStyleField = subImgStyleFields.options.filter((option) => option.subID === currentAssociatedSubId)[0]

    const currentSecondaryStyle: string = getValues('secondary_style')
    useEffect(() => {
      if (!subImgStyleField.options.includes(currentSecondaryStyle)) {
        setValue('secondary_style', '')
      }
    }, [currentSecondaryStyle, subImgStyleField.options])

    return subImgStyleField
  }

  // Does not reset settings - only prompt, prompt parameters and negative prompt
  const onReset = () => {
    formDataResetableFields.forEach((field) => resetField(field as keyof GenerateImageFormI))
    onNewErrorMsg('')
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ pb: 5 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
            <Typography variant="h1" color={palette.text.secondary} sx={{ fontSize: '1.8rem' }}>
              {'Generate with'}
            </Typography>
            <FormInputDropdown
              name="modelVersion"
              label=""
              control={control}
              field={modelField}
              styleSize="big"
              width=""
              required={false}
            />
          </Stack>
        </Box>
        <>
          {errorMsg !== '' && (
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    onRequestSent(false)
                  }}
                  sx={{ pt: 0.2 }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ height: 'auto', mb: 2, fontSize: 16, fontWeight: 500, pt: 1, color: palette.text.secondary }}
            >
              {errorMsg}
            </Alert>
          )}
        </>

        <FormInputText
          name="prompt"
          control={control}
          label="Prompt - What would you like to generate?"
          required={true}
          rows={4}
        />

        <Stack justifyContent="flex-end" direction="row" gap={0} pb={3}>
          <CustomTooltip title="Get prompt ideas" size="small">
            <IconButton
              onClick={() => setValue('prompt', getRandomPrompt())}
              aria-label="Random prompt"
              disableRipple
              sx={{ px: 0.5 }}
            >
              <Avatar sx={CustomizedAvatarButton}>
                <Lightbulb sx={CustomizedIconButton} />
              </Avatar>
            </IconButton>
          </CustomTooltip>
          <CustomTooltip title="Reset all fields" size="small">
            <IconButton
              disabled={isLoading}
              onClick={() => onReset()}
              aria-label="Reset form"
              disableRipple
              sx={{ px: 0.5 }}
            >
              <Avatar sx={CustomizedAvatarButton}>
                <Autorenew sx={CustomizedIconButton} />
              </Avatar>
            </IconButton>
          </CustomTooltip>
          <FormInputGenerateSettings
            control={control}
            setValue={setValue}
            generalSettingsFields={generalSettingsFields}
            advancedSettingsFields={advancedSettingsFields}
          />
          <CustomTooltip title="Have Gemini enhance your prompt" size="small">
            <GeminiSwitch checked={isGeminiRewrite} onChange={handleGeminiRewrite} />
          </CustomTooltip>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            endIcon={isLoading ? <WatchLaterIcon /> : <SendIcon />}
            sx={CustomizedSendButton}
          >
            {'Generate'}
          </Button>
        </Stack>
        <Accordion disableGutters sx={CustomizedAccordion} defaultExpanded>
          <AccordionSummary
            expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
            aria-controls="panel1-content"
            id="panel1-header"
            sx={CustomizedAccordionSummary}
          >
            <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
              {'Customize Style & Composition'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack
              direction="row"
              spacing={3}
              flexWrap="wrap"
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ pt: 1, height: 100 }}
            >
              <FormInputDropdown
                name="style"
                label="Primary style"
                control={control}
                field={imgStyleField}
                styleSize="small"
                width="140px"
                required={true}
              />
              <FormInputChipGroup
                name="secondary_style"
                label={subImgStyleField(control).label}
                control={control}
                setValue={setValue}
                width="400px"
                mandatory={false}
                field={subImgStyleField(control)}
                required={false}
              />
            </Stack>
            <Stack direction="row" spacing={0} sx={{ pt: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {Object.entries(compositionFields).map(function ([param, field]) {
                return (
                  <Box key={param} py={1} width="50%">
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
          </AccordionDetails>
        </Accordion>
      </form>
    </>
  )
}
