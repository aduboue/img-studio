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
  Mms,
} from '@mui/icons-material'

import { FormInputText } from '../ux-components/InputText'
import FormInputDropdown from '../ux-components/InputDropdown'
import FormInputChipGroup from '../ux-components/InputChipGroup'
import FormInputGenerateSettings from './GenerateSettings'

import {
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
  ReferenceObjectInit,
  ReferenceObjectDefaults,
  maxReferences,
  GenerateImageFormFields,
} from '../../api/generate-utils'

import theme from '../../theme'
import { generateImage } from '../../api/imagen/action'
import { GeminiSwitch } from '../ux-components/GeminiButton'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from '../ux-components/Button-SX'
import { useEffect, useState } from 'react'
import CustomTooltip from '../ux-components/Tooltip'
import { CustomizedAccordion, CustomizedAccordionSummary } from '../ux-components/Accordion-SX'
import { useAppContext } from '../../context/app-context'
import { ReferenceBox } from './ReferenceBox'
import { EditImageFormFields } from '@/app/api/edit-utils'
import ImageToPromptModal from './ImageToPromptModal'
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
  const { handleSubmit, resetField, control, setValue, getValues, watch } = useForm<GenerateImageFormI>({
    defaultValues: formDataDefaults,
  })
  const { appContext } = useAppContext()

  // Manage if prompt should be generated with Gemini
  const [isGeminiRewrite, setIsGeminiRewrite] = useState(true)
  const handleGeminiRewrite = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsGeminiRewrite(event.target.checked)
  }

  const [expanded, setExpanded] = React.useState<string | false>(false)
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  // Reference management logic
  const referenceObjects = watch('referenceObjects')
  const [hasReferences, setHasReferences] = useState(false)
  useEffect(() => {
    if (referenceObjects.some((obj) => obj.base64Image !== '')) {
      setHasReferences(true)
      setValue('modelVersion', EditImageFormFields.modelVersion.default)
    } else {
      setHasReferences(false)
      setValue('modelVersion', GenerateImageFormFields.modelVersion.default)
    }
  }, [JSON.stringify(referenceObjects)])

  const removeReferenceObject = (objectKey: string) => {
    // Find the reference object to be removed
    const removeReference = referenceObjects.find((obj) => obj.objectKey === objectKey)
    if (!removeReference) return

    let updatedReferenceObjects = [...referenceObjects]

    // If reference is an AdditionalImage, remove only it,
    // otherwise remove all references with the same ID and update the refId of the remaining ones
    if (removeReference.isAdditionalImage) {
      updatedReferenceObjects = referenceObjects.filter((obj) => obj.objectKey !== objectKey)
    } else {
      updatedReferenceObjects = referenceObjects.filter((obj) => obj.refId !== removeReference.refId)
      // Update refId of remaining objects
      updatedReferenceObjects = updatedReferenceObjects.map((obj) => {
        if (obj.refId > removeReference.refId) return { ...obj, refId: obj.refId - 1 }
        return obj
      })
    }

    if (updatedReferenceObjects.length === 0) setValue('referenceObjects', ReferenceObjectInit)
    else setValue('referenceObjects', updatedReferenceObjects)
  }

  const addNewRefObject = () => {
    if (referenceObjects.length >= maxReferences) return

    let highestId = referenceObjects[0].refId
    for (let i = 1; i < referenceObjects.length; i++)
      if (referenceObjects[i].refId > highestId) highestId = referenceObjects[i].refId

    const updatedReferenceObjects = [
      ...referenceObjects,
      {
        ...ReferenceObjectDefaults,
        isAdditionalImage: false,
        objectKey: Math.random().toString(36).substring(2, 15),
        refId: highestId + 1,
      },
    ]

    setValue('referenceObjects', updatedReferenceObjects)
  }

  const addAdditionalRefObject = (objectKey: string) => {
    if (referenceObjects.length >= maxReferences) return

    const associatedObjectIndex = referenceObjects.findIndex((obj) => obj.objectKey === objectKey)
    const associatedObject = referenceObjects.find((obj) => obj.objectKey === objectKey)
    if (!associatedObject) return

    // Use slice to place the Additional Ref object after its parent ref
    const updatedReferenceObjects = [
      ...referenceObjects.slice(0, associatedObjectIndex + 1),
      {
        ...associatedObject,
        isAdditionalImage: true,
        base64Image: '',
        objectKey: Math.random().toString(36).substring(2, 15),
      },
      ...referenceObjects.slice(associatedObjectIndex + 1),
    ]

    setValue('referenceObjects', updatedReferenceObjects)
  }

  // Image to prompt generator logic
  const [imageToPromptOpen, setImageToPromptOpen] = useState(false)

  // Provide random prompt
  const getRandomPrompt = () => {
    return RandomPrompts[Math.floor(Math.random() * RandomPrompts.length)]
  }

  // Handle 'Replay prompt' from Library
  useEffect(() => {
    if (appContext && appContext.promptToGenerate) setValue('prompt', appContext.promptToGenerate)
  }, [appContext?.promptToGenerate])

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

  const onSubmit: SubmitHandler<GenerateImageFormI> = async (formData: GenerateImageFormI) => {
    onRequestSent(true)

    try {
      const areAllRefValid = formData['referenceObjects'].every(
        (reference) =>
          reference.base64Image !== '' &&
          reference.description !== '' &&
          reference.refId !== null &&
          reference.referenceType !== ''
      )
      if (hasReferences && !areAllRefValid)
        throw Error('Incomplete reference(s) information provided, either image type or description missing.')

      const newGeneratedImages = await generateImage(formData, areAllRefValid, isGeminiRewrite, appContext)

      if (newGeneratedImages !== undefined && typeof newGeneratedImages === 'object' && 'error' in newGeneratedImages) {
        const errorMsg = newGeneratedImages['error'].replaceAll('Error: ', '')
        throw Error(errorMsg)
      } else {
        newGeneratedImages.map((image) => {
          if ('warning' in image) onNewErrorMsg(image['warning'] as string)
        })

        onImageGeneration(newGeneratedImages)
      }
    } catch (error: any) {
      onNewErrorMsg(error.toString())
    }
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
              field={hasReferences ? EditImageFormFields.modelVersion : GenerateImageFormFields.modelVersion}
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
          rows={7}
        />

        <Stack justifyContent="flex-end" direction="row" gap={0} pb={3}>
          <CustomTooltip title="Image to prompt generator" size="small">
            <IconButton
              onClick={() => setImageToPromptOpen(true)}
              aria-label="Prompt Generator"
              disableRipple
              sx={{ px: 0.5 }}
            >
              <Avatar sx={CustomizedAvatarButton}>
                <Mms sx={CustomizedIconButton} />
              </Avatar>
            </IconButton>
          </CustomTooltip>
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
        {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && (
          <Accordion
            disableGutters
            expanded={expanded === 'references'}
            onChange={handleChange('references')}
            sx={CustomizedAccordion}
          >
            <AccordionSummary
              expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
              aria-controls="panel1-content"
              id="panel1-header"
              sx={CustomizedAccordionSummary}
            >
              <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
                {'Subject & Style reference(s)'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1, height: 'auto' }}>
              <Stack
                direction="column"
                flexWrap="wrap"
                justifyContent="flex-start"
                alignItems="flex-start"
                spacing={1}
                sx={{ pt: 0, pb: 1 }}
              >
                {referenceObjects.map((referenceObject, index) => {
                  return (
                    <ReferenceBox
                      key={referenceObject.objectKey + index + '_box'}
                      objectKey={referenceObject.objectKey}
                      currentReferenceObject={referenceObject}
                      onNewErrorMsg={onNewErrorMsg}
                      control={control}
                      setValue={setValue}
                      removeReferenceObject={removeReferenceObject}
                      addAdditionalRefObject={addAdditionalRefObject}
                      refPosition={index}
                      refCount={referenceObjects.length}
                    />
                  )
                })}
              </Stack>
              {referenceObjects.length < maxReferences && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    onClick={() => addNewRefObject()}
                    disabled={referenceObjects.length >= maxReferences}
                    sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem', px: 0 } }}
                  >
                    {'Add'}
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}
        <Accordion
          disableGutters
          defaultExpanded
          expanded={expanded === 'attributes'}
          onChange={handleChange('attributes')}
          sx={{ ...CustomizedAccordion }}
        >
          <AccordionSummary
            expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
            aria-controls="panel1-content"
            id="panel1-header"
            sx={CustomizedAccordionSummary}
          >
            <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
              {'Image attributes'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 0 }}>
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

      <ImageToPromptModal
        open={imageToPromptOpen}
        setNewPrompt={(string) => setValue('prompt', string)}
        setImageToPromptOpen={setImageToPromptOpen}
      />
    </>
  )
}
