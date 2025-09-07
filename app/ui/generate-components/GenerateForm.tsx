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
import { useEffect, useState } from 'react'

import { SubmitHandler, useForm } from 'react-hook-form'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowRight,
  Autorenew,
  Close as CloseIcon,
  Lightbulb,
  Mms,
  Send as SendIcon,
  WatchLater as WatchLaterIcon,
} from '@mui/icons-material'

import { CustomizedAccordion, CustomizedAccordionSummary } from '../ux-components/Accordion-SX'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from '../ux-components/Button-SX'
import FormInputChipGroup from '../ux-components/InputChipGroup'
import FormInputDropdown from '../ux-components/InputDropdown'
import { FormInputText } from '../ux-components/InputText'
import { GeminiSwitch } from '../ux-components/GeminiButton'
import CustomTooltip from '../ux-components/Tooltip'

import GenerateSettings from './GenerateSettings'
import ImageToPromptModal from './ImageToPromptModal'
import { ReferenceBox } from './ReferenceBox'

import theme from '../../theme'
const { palette } = theme

import { useAppContext } from '../../context/app-context'
import { generateImage } from '../../api/imagen/action'
import {
  chipGroupFieldsI,
  GenerateImageFormFields,
  GenerateImageFormI,
  ImageGenerationFieldsI,
  ImageI,
  maxReferences,
  ReferenceObjectDefaults,
  ReferenceObjectInit,
  selectFieldsI,
} from '../../api/generate-image-utils'
import { EditImageFormFields } from '@/app/api/edit-utils'
import {
  GenerateVideoFormFields,
  GenerateVideoFormI,
  InterpolImageDefaults,
  InterpolImageI,
  OperationMetadataI,
  tempVeo3specificSettings,
  VideoGenerationFieldsI,
  videoGenerationUtils,
} from '@/app/api/generate-video-utils'
import { generateVideo } from '@/app/api/veo/action'
import { getOrientation, VideoInterpolBox } from './VideoInterpolBox'
import { AudioSwitch } from '../ux-components/AudioButton'

export default function GenerateForm({
  generationType,
  isLoading,
  onRequestSent,
  errorMsg,
  onNewErrorMsg,
  generationFields,
  randomPrompts,
  onImageGeneration,
  onVideoPollingStart,
  initialPrompt,
  initialITVimage,
  promptIndication,
}: {
  generationType: 'Image' | 'Video'
  isLoading: boolean
  onRequestSent: (loading: boolean, count: number) => void
  errorMsg: string
  onNewErrorMsg: (newErrorMsg: string) => void
  generationFields: ImageGenerationFieldsI | VideoGenerationFieldsI
  randomPrompts: string[]
  onImageGeneration?: (newImages: ImageI[]) => void
  onVideoPollingStart?: (operationName: string, metadata: OperationMetadataI) => void
  initialPrompt?: string
  initialITVimage?: InterpolImageI
  promptIndication?: string
}) {
  // --- Component Setup ---
  const {
    handleSubmit,
    resetField,
    control,
    setValue,
    getValues,
    watch,
    formState: { touchedFields },
  } = useForm<GenerateVideoFormI | GenerateImageFormI>({
    defaultValues: generationFields.defaultValues,
  })
  const { appContext } = useAppContext()

  // --- State Management ---
  // Manages the expanded state of the accordions.
  const [expanded, setExpanded] = React.useState<string | false>('attributes')
  // Manages whether to use Gemini for prompt rewriting.
  const [isGeminiRewrite, setIsGeminiRewrite] = useState(true)
  // Manages the visibility of the image-to-prompt modal.
  const [imageToPromptOpen, setImageToPromptOpen] = useState(false)
  // Manages the orientation of the image-to-video input boxes.
  const [orientation, setOrientation] = useState('horizontal')

  // --- Watched Form Values ---
  const referenceObjects = watch('referenceObjects')
  const isVideoWithAudio = watch('isVideoWithAudio')
  const interpolImageFirst = watch('interpolImageFirst')
  const interpolImageLast = watch('interpolImageLast')
  const selectedRatio = watch('aspectRatio')
  const firstImageRatio = watch('interpolImageFirst.ratio')
  const lastImageRatio = watch('interpolImageLast.ratio')
  const currentModel = watch('modelVersion')
  const currentPrimaryStyle = watch('style')
  const currentSecondaryStyle = watch('secondary_style')

  // --- Derived and Memoized Values ---
  // Determines if the form has any valid reference objects.
  const hasReferences = React.useMemo(
    () => Array.isArray(referenceObjects) && referenceObjects.some((obj) => obj.base64Image !== ''),
    [referenceObjects]
  )

  // Dynamically selects the model version options based on generation type and references.
  const modelOptionField: selectFieldsI = React.useMemo(() => {
    if (generationType === 'Video') {
      return GenerateVideoFormFields.modelVersion
    }
    return hasReferences ? EditImageFormFields.modelVersion : GenerateImageFormFields.modelVersion
  }, [generationType, hasReferences])

  // Determines if the prompt is optional for video generation (e.g., for image-to-video).
  const optionalVeoPrompt =
    (interpolImageFirst && interpolImageFirst.base64Image !== '') ||
    (interpolImageFirst &&
      interpolImageFirst.base64Image !== '' &&
      interpolImageLast &&
      interpolImageLast.base64Image !== '')

  // Determines if the current model supports audio generation.
  const isAudioAvailable = currentModel.includes('veo-3.0')
  // Determines if only image-to-video is available for the current model.
  const isOnlyITVavailable =
    currentModel.includes('veo-3.0') &&
    !currentModel.includes('fast') &&
    process.env.NEXT_PUBLIC_VEO_ITV_ENABLED === 'true'
  // Determines if advanced features are available for the current model.
  const isAdvancedFeaturesAvailable =
    currentModel.includes('veo-2.0') && process.env.NEXT_PUBLIC_VEO_ADVANCED_ENABLED === 'true'

  // Determines the available secondary styles based on the selected primary style.
  const subImgStyleField = React.useMemo(() => {
    const { styleOptions, subStyleOptions } = generationFields
    const selectedStyle = styleOptions.options.find((o) => o.value === currentPrimaryStyle)
    const subId = selectedStyle ? selectedStyle.subID : styleOptions.defaultSub
    return subStyleOptions.options.find((o) => o.subID === subId) || subStyleOptions.options[0]
  }, [currentPrimaryStyle, generationFields])

  // --- Side Effects ---
  // Manages accordion expansion based on initial image-to-video image.
  useEffect(() => {
    if (generationType === 'Video') {
      if (initialITVimage && initialITVimage.base64Image !== '') setExpanded('interpolation')
      else setExpanded('attributes')
    } else if (generationType === 'Image') setExpanded('attributes')
  }, [initialITVimage, generationType])

  // Sets the model version to the default for the selected options.
  useEffect(() => {
    if (getValues('modelVersion') !== modelOptionField.default) {
      setValue('modelVersion', modelOptionField.default)
    }
  }, [modelOptionField, setValue, getValues])

  // Automatically sets the aspect ratio from the input image if not manually set.
  useEffect(() => {
    if (touchedFields.aspectRatio) return

    const imageRatioString = firstImageRatio || lastImageRatio

    if (imageRatioString) {
      const imageOrientation = getOrientation(imageRatioString)
      const suggestedRatio = imageOrientation === 'horizontal' ? '16:9' : '9:16'

      setValue('aspectRatio', suggestedRatio)
    }
  }, [firstImageRatio, lastImageRatio, touchedFields.aspectRatio, setValue])

  // Updates the UI orientation whenever the aspect ratio changes.
  useEffect(() => {
    if (selectedRatio) setOrientation(getOrientation(selectedRatio))
  }, [selectedRatio])

  // Resets fields based on the selected model's capabilities.
  useEffect(() => {
    if (!isAdvancedFeaturesAvailable) {
      setValue('cameraPreset', '')
      setValue('interpolImageLast', { ...InterpolImageDefaults, purpose: 'last' })

      if (!isOnlyITVavailable) setValue('interpolImageFirst', { ...InterpolImageDefaults, purpose: 'first' })
    }

    if (currentModel.includes('veo-2.0')) setValue('resolution', '720p')
  }, [currentModel, isAdvancedFeaturesAvailable, isOnlyITVavailable, setValue])

  // Populates the prompt field from the library's initial prompt.
  useEffect(() => {
    if (initialPrompt) setValue('prompt', initialPrompt)
  }, [initialPrompt, setValue])

  // Populates the image-to-video field from the library's initial image.
  useEffect(() => {
    if (initialITVimage) setValue('interpolImageFirst', initialITVimage)
  }, [initialITVimage, setValue])

  // Resets secondary style if it becomes invalid when primary style changes.
  useEffect(() => {
    if (subImgStyleField && currentSecondaryStyle && !subImgStyleField.options.includes(currentSecondaryStyle)) {
      setValue('secondary_style', '')
    }
  }, [currentSecondaryStyle, subImgStyleField, setValue])

  // --- Event Handlers and Helper Functions ---
  // Handles accordion expansion changes.
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  // Handles the Gemini rewrite switch change.
  const handleGeminiRewrite = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsGeminiRewrite(event.target.checked)
  }

  // Handles the video audio switch change.
  const handleVideoAudioCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('isVideoWithAudio', event.target.checked)
  }

  // Removes a reference object from the form.
  const removeReferenceObject = (objectKey: string) => {
    const removeReference = referenceObjects.find((obj) => obj.objectKey === objectKey)
    if (!removeReference) return

    let updatedReferenceObjects = [...referenceObjects]

    if (removeReference.isAdditionalImage) {
      updatedReferenceObjects = referenceObjects.filter((obj) => obj.objectKey !== objectKey)
    } else {
      updatedReferenceObjects = referenceObjects.filter((obj) => obj.refId !== removeReference.refId)
      updatedReferenceObjects = updatedReferenceObjects.map((obj) => {
        if (obj.refId > removeReference.refId) return { ...obj, refId: obj.refId - 1 }
        return obj
      })
    }

    if (updatedReferenceObjects.length === 0) setValue('referenceObjects', ReferenceObjectInit)
    else setValue('referenceObjects', updatedReferenceObjects)
  }

  // Adds a new reference object to the form.
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

  // Adds an additional reference object image to the form.
  const addAdditionalRefObject = (objectKey: string) => {
    if (referenceObjects.length >= maxReferences) return

    const associatedObjectIndex = referenceObjects.findIndex((obj) => obj.objectKey === objectKey)
    const associatedObject = referenceObjects.find((obj) => obj.objectKey === objectKey)
    if (!associatedObject) return

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

  // Transforms a "Publisher Model not found" error message into a user-friendly message.
  interface ModelOption {
    value: string
    label: string
    indication?: string
    type?: string
  }
  function manageModelNotFoundError(errorMessage: string, modelOptions: ModelOption[]): string {
    const modelNotFoundRegex =
      /Publisher Model `projects\/[^/]+\/locations\/[^/]+\/publishers\/google\/models\/([^`]+)` not found\./
    const match = errorMessage.match(modelNotFoundRegex)

    if (match && match[1]) {
      const modelValue = match[1]
      const correspondingModel = modelOptions.find((model) => model.value === modelValue)

      const modelLabel = correspondingModel ? correspondingModel.label : modelValue

      return `You don't have access to the model '${modelLabel}', please select another one in the top dropdown menu for now, and reach out to your IT Admin to request access to '${modelLabel}'.`
    }

    return errorMessage
  }

  // Provides a random prompt from the list of random prompts.
  const getRandomPrompt = () => {
    return randomPrompts[Math.floor(Math.random() * randomPrompts.length)]
  }

  // Resets the form to its default state.
  const onReset = () => {
    generationFields.resetableFields.forEach((field) =>
      resetField(field as keyof GenerateImageFormI | keyof GenerateVideoFormI)
    )

    if (generationType === 'Video') {
      setValue('interpolImageFirst', generationFields.defaultValues.interpolImageFirst)
      setValue('interpolImageLast', generationFields.defaultValues.interpolImageLast)
    }

    setOrientation('horizontal')
    onNewErrorMsg('')
  }

  // --- Form Submission Handlers ---
  // Handles image generation submission.
  const onImageSubmit: SubmitHandler<GenerateImageFormI> = async (formData) => {
    onRequestSent(true, parseInt(formData.sampleCount))

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

      if (hasReferences && areAllRefValid) setIsGeminiRewrite(false)

      const newGeneratedImages = await generateImage(formData, areAllRefValid, isGeminiRewrite, appContext)

      if (newGeneratedImages !== undefined && typeof newGeneratedImages === 'object' && 'error' in newGeneratedImages) {
        let errorMsg = newGeneratedImages['error'].replaceAll('Error: ', '')

        errorMsg = manageModelNotFoundError(errorMsg, generationFields.model.options as ModelOption[])

        throw Error(errorMsg)
      } else {
        newGeneratedImages.map((image) => {
          if ('warning' in image) onNewErrorMsg(image['warning'] as string)
        })

        onImageGeneration && onImageGeneration(newGeneratedImages)
      }
    } catch (error: any) {
      onNewErrorMsg(error.toString())
    }
  }

  // Handles video generation submission.
  const onVideoSubmit: SubmitHandler<GenerateVideoFormI> = async (formData) => {
    onRequestSent(true, parseInt(formData.sampleCount))

    try {
      if (formData.interpolImageLast && formData.interpolImageLast.base64Image !== '' && formData.cameraPreset !== '')
        throw Error(
          `You can't have both a last frame and a camera preset selected. Please leverage only one of the two feature at once.`
        )

      const result = await generateVideo(formData, appContext)

      if ('error' in result) {
        let errorMsg = result.error.replace('Error: ', '')
        errorMsg = manageModelNotFoundError(errorMsg, generationFields.model.options as ModelOption[])

        throw new Error(errorMsg)
      } else if ('operationName' in result && 'prompt' in result)
        onVideoPollingStart && onVideoPollingStart(result.operationName, { formData: formData, prompt: result.prompt })
      else throw new Error('Failed to initiate video generation: Invalid response from server.')
    } catch (error: any) {
      onNewErrorMsg(error.toString().replace('Error: ', ''))
    }
  }

  // Main submission handler that delegates to the appropriate generation handler.
  const onSubmit: SubmitHandler<GenerateImageFormI | GenerateVideoFormI> = async (formData) => {
    if (generationType === 'Image') await onImageSubmit(formData as GenerateImageFormI)
    else if (generationType === 'Video') await onVideoSubmit(formData as GenerateVideoFormI)
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ pb: 4 }}>
          <Box sx={{ pb: 5 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
              <Typography variant="h1" color={palette.text.secondary} sx={{ fontSize: '1.8rem' }}>
                {'Generate with'}
              </Typography>
              <FormInputDropdown
                name="modelVersion"
                label=""
                control={control}
                field={modelOptionField}
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
                      onRequestSent(false, 0)
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
            label={`${optionalVeoPrompt ? '(Optional)' : ''} Prompt - What would you like to generate?`}
            required={!optionalVeoPrompt}
            rows={7}
            promptIndication={`${promptIndication}${
              isAudioAvailable ? ', audio (dialogue/ sound effects/ music/ ambiant sounds)' : ''
            }`}
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
            <GenerateSettings
              control={control}
              setValue={setValue}
              generalSettingsFields={
                currentModel.includes('veo-3.0') ? tempVeo3specificSettings : generationFields.settings
              }
              advancedSettingsFields={generationFields.advancedSettings}
              warningMessage={
                currentModel.includes('veo-3.0') ? 'NB: for now, Veo 3 has fewer setting options than Veo 2!' : ''
              }
            />
            {isAudioAvailable && (
              <CustomTooltip title="Add audio to your video" size="small">
                <AudioSwitch checked={isVideoWithAudio} onChange={handleVideoAudioCheck} />
              </CustomTooltip>
            )}
            {currentModel.includes('imagen') && !hasReferences && (
              <CustomTooltip title="Have Gemini enhance your prompt" size="small">
                <GeminiSwitch checked={isGeminiRewrite} onChange={handleGeminiRewrite} />
              </CustomTooltip>
            )}
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
          {generationType === 'Image' && process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && (
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
          {generationType === 'Video' && (isOnlyITVavailable || isAdvancedFeaturesAvailable) && (
            <Accordion
              disableGutters
              expanded={expanded === 'interpolation'}
              onChange={handleChange('interpolation')}
              sx={CustomizedAccordion}
            >
              <AccordionSummary
                expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
                aria-controls="panel1-content"
                id="panel1-header"
                sx={CustomizedAccordionSummary}
              >
                <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
                  {isAdvancedFeaturesAvailable ? 'Image(s) to video & Camera presets' : 'Image to video'}
                </Typography>
              </AccordionSummary>
              {
                // Advanced features (interpolation, camera preset) are only available for Veo 2 for now!
                isAdvancedFeaturesAvailable && (
                  <AccordionDetails sx={{ pt: 0, pb: 1, height: 'auto' }}>
                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      justifyContent="flex-start"
                      alignItems="flex-start"
                      spacing={0.5}
                      sx={{ pt: 1, pb: 1 }}
                    >
                      <VideoInterpolBox
                        label="Base image"
                        sublabel={'(or first frame)'}
                        objectKey="interpolImageFirst"
                        onNewErrorMsg={onNewErrorMsg}
                        setValue={setValue}
                        interpolImage={interpolImageFirst}
                        orientation={orientation}
                      />

                      <ArrowRight color={interpolImageLast.base64Image === '' ? 'secondary' : 'primary'} />
                      <VideoInterpolBox
                        label="Last frame"
                        sublabel="(optional)"
                        objectKey="interpolImageLast"
                        onNewErrorMsg={onNewErrorMsg}
                        setValue={setValue}
                        interpolImage={interpolImageLast}
                        orientation={orientation}
                      />
                    </Stack>
                    <Box sx={{ py: 2 }}>
                      <FormInputChipGroup
                        name="cameraPreset"
                        label={videoGenerationUtils.cameraPreset.label ?? ''}
                        control={control}
                        setValue={setValue}
                        width="450px"
                        field={videoGenerationUtils.cameraPreset as chipGroupFieldsI}
                        required={false}
                      />
                    </Box>
                  </AccordionDetails>
                )
              }
              {
                // Advanced features (interpolation, camera preset) are only available for Veo 2 for now!
                isOnlyITVavailable && (
                  <AccordionDetails sx={{ pt: 0, pb: 1, height: 'auto' }}>
                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      justifyContent="flex-start"
                      alignItems="flex-start"
                      spacing={0.5}
                      sx={{ pt: 1, pb: 1 }}
                    >
                      <VideoInterpolBox
                        label="Base image"
                        sublabel={'(input)'}
                        objectKey="interpolImageFirst"
                        onNewErrorMsg={onNewErrorMsg}
                        setValue={setValue}
                        interpolImage={interpolImageFirst}
                        orientation={orientation}
                      />
                      <Typography
                        color={palette.warning.main}
                        sx={{ fontSize: '0.85rem', fontWeight: 400, pt: 2, width: '70%' }}
                      >
                        {
                          'For now, Veo 3 does not support Image Interpolation and Camera Presets, switch to Veo 2 to use them!'
                        }
                      </Typography>
                    </Stack>
                  </AccordionDetails>
                )
              }
            </Accordion>
          )}
          <Accordion
            disableGutters
            defaultExpanded
            expanded={expanded === 'attributes'}
            onChange={handleChange('attributes')}
            sx={CustomizedAccordion}
          >
            <AccordionSummary
              expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
              aria-controls="panel1-content"
              id="panel1-header"
              sx={CustomizedAccordionSummary}
            >
              <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
                {generationType + ' / prompt attributes'}
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
                  field={generationFields.styleOptions}
                  styleSize="small"
                  width="140px"
                  required={true}
                />
                <FormInputChipGroup
                  name="secondary_style"
                  label={subImgStyleField.label}
                  control={control}
                  setValue={setValue}
                  width="400px"
                  field={subImgStyleField}
                  required={false}
                />
              </Stack>
              <Stack direction="row" spacing={0} sx={{ pt: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {Object.entries(generationFields.compositionOptions).map(function ([param, field]) {
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
        </Box>
      </form>

      <ImageToPromptModal
        open={imageToPromptOpen}
        setNewPrompt={(string) => setValue('prompt', string)}
        setImageToPromptOpen={setImageToPromptOpen}
        target={generationType}
      />
    </>
  )
}
