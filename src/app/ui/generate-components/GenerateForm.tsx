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

import { Control, SubmitHandler, useForm, useWatch } from 'react-hook-form'

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
  ArrowLeft,
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
  const { handleSubmit, resetField, control, setValue, getValues, watch } = useForm<
    GenerateVideoFormI | GenerateImageFormI
  >({
    defaultValues: generationFields.defaultValues,
  })
  const { appContext } = useAppContext()

  // Manage accordions
  const [expanded, setExpanded] = React.useState<string | false>('attributes')
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }
  useEffect(() => {
    if (generationType === 'Video') {
      if (initialITVimage && initialITVimage.base64Image !== '') setExpanded('interpolation')
      else setExpanded('attributes')
    } else if (generationType === 'Image') setExpanded('attributes')
  }, [initialITVimage, generationType])

  // Manage if prompt should be generated with Gemini
  const [isGeminiRewrite, setIsGeminiRewrite] = useState(true)
  const handleGeminiRewrite = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsGeminiRewrite(event.target.checked)
  }

  // Veo 3: manage audio in output
  const isVideoWithAudio = watch('isVideoWithAudio')
  const handleVideoAudioCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('isVideoWithAudio', event.target.checked)
  }

  // Imagen reference management logic
  const referenceObjects = watch('referenceObjects')
  const [hasReferences, setHasReferences] = useState(false)
  const [modelOptionField, setModelOptionField] = useState<selectFieldsI>(GenerateImageFormFields.modelVersion)
  useEffect(() => {
    if (generationType === 'Image') {
      if (referenceObjects.some((obj) => obj.base64Image !== '')) {
        setHasReferences(true)
        setModelOptionField(EditImageFormFields.modelVersion)
        setValue('modelVersion', EditImageFormFields.modelVersion.default)
      } else {
        setHasReferences(false)
        setModelOptionField(GenerateImageFormFields.modelVersion)
        setValue('modelVersion', GenerateImageFormFields.modelVersion.default)
      }
    }
    if (generationType === 'Video') {
      setModelOptionField(GenerateVideoFormFields.modelVersion)
      setValue('modelVersion', GenerateVideoFormFields.modelVersion.default)
    }
  }, [JSON.stringify(referenceObjects), generationType])
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

  // Veo interpolation image management logic
  const interpolImageFirst = watch('interpolImageFirst')
  const interpolImageLast = watch('interpolImageLast')
  const optionalVeoPrompt = // Prompt optional if either only first frame, OR if both first and last frame
    (interpolImageFirst && interpolImageFirst.base64Image !== '') ||
    (interpolImageFirst &&
      interpolImageFirst.base64Image !== '' &&
      interpolImageLast &&
      interpolImageLast.base64Image !== '')
  let orientation = 'horizontal'
  orientation =
    interpolImageFirst && interpolImageFirst.base64Image !== ''
      ? getOrientation(interpolImageFirst.ratio)
      : interpolImageLast && interpolImageLast.base64Image !== ''
      ? getOrientation(interpolImageLast.ratio)
      : ''
  useEffect(() => {
    if (orientation === 'horizontal') setValue('aspectRatio', '16:9')
    else if (orientation === 'vertical') setValue('aspectRatio', '9:16')
  }, [orientation])

  //TODO temp - remove when Veo 3 is fully released
  const currentModel = watch('modelVersion')

  //TODO temp - remove when models are GA
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

  // Image to prompt generator logic
  const [imageToPromptOpen, setImageToPromptOpen] = useState(false)

  // Provide random prompt
  const getRandomPrompt = () => {
    return randomPrompts[Math.floor(Math.random() * randomPrompts.length)]
  }

  // Handle 'Replay prompt' from Library
  useEffect(() => {
    if (initialPrompt) setValue('prompt', initialPrompt)
  }, [initialPrompt, setValue])

  // Handle Image to video from generated or edited image
  useEffect(() => {
    if (initialITVimage) setValue('interpolImageFirst', initialITVimage)
  }, [initialITVimage, setValue])

  // Update Secondary style dropdown depending on picked primary style
  const subImgStyleField = (control: Control<GenerateImageFormI | GenerateVideoFormI, any>) => {
    const currentPrimaryStyle: string = useWatch({ control, name: 'style' })

    var currentAssociatedSubId = generationFields.styleOptions.defaultSub
    if (currentPrimaryStyle !== '') {
      currentAssociatedSubId = generationFields.styleOptions.options.filter(
        (option) => option.value === currentPrimaryStyle
      )[0].subID
    }

    const subImgStyleField = generationFields.subStyleOptions.options.filter(
      (option) => option.subID === currentAssociatedSubId
    )[0]

    const currentSecondaryStyle: string = getValues('secondary_style')
    useEffect(() => {
      if (!subImgStyleField.options.includes(currentSecondaryStyle)) {
        setValue('secondary_style', '')
      }
    }, [currentSecondaryStyle, subImgStyleField.options])

    return subImgStyleField
  }

  // Does not reset settings - only prompt, prompt parameters, image references and negative prompt
  const onReset = () => {
    generationFields.resetableFields.forEach((field) =>
      resetField(field as keyof GenerateImageFormI | keyof GenerateVideoFormI)
    )

    if (generationType === 'Video') {
      setValue('interpolImageFirst', generationFields.defaultValues.interpolImageFirst)
      setValue('interpolImageLast', generationFields.defaultValues.interpolImageLast)
    }

    onNewErrorMsg('')
  }

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

  const onVideoSubmit: SubmitHandler<GenerateVideoFormI> = async (formData) => {
    onRequestSent(true, parseInt(formData.sampleCount))

    try {
      if (formData.interpolImageLast && formData.interpolImageLast.base64Image !== '' && formData.cameraPreset !== '')
        throw Error(
          `You can't have both a last frame and a camera preset selected. Please leverage only one of the two feature at once.`
        )

      if (formData.prompt === '') setIsGeminiRewrite(false)
      const result = await generateVideo(formData, isGeminiRewrite, appContext)

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

  // Single handler for submitting generation
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
              currentModel === 'veo-3.0-generate-preview'
                ? ', audio (dialogue/ sound effects/ music/ ambiant sounds)'
                : ''
            }`}
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
            <GenerateSettings
              control={control}
              setValue={setValue}
              generalSettingsFields={
                currentModel === 'veo-3.0-generate-preview' ? tempVeo3specificSettings : generationFields.settings
              }
              advancedSettingsFields={generationFields.advancedSettings}
              warningMessage={
                currentModel === 'veo-3.0-generate-preview'
                  ? 'NB: for now, Veo 3 has fewer setting options than Veo 2!'
                  : ''
              }
            />
            {currentModel === 'veo-3.0-generate-preview' && (
              <CustomTooltip title="Add audio to your video" size="small">
                <AudioSwitch checked={isVideoWithAudio} onChange={handleVideoAudioCheck} />
              </CustomTooltip>
            )}
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
          {generationType === 'Video' &&
            process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' &&
            process.env.NEXT_PUBLIC_VEO_ITV_ENABLED === 'true' && (
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
                    {`Image(s) to video ${
                      process.env.NEXT_PUBLIC_VEO_ADVANCED_ENABLED === 'true' ? ' & Camera presets' : ''
                    }`}
                  </Typography>
                </AccordionSummary>
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
                      sublabel={
                        process.env.NEXT_PUBLIC_VEO_ADVANCED_ENABLED === 'true' ? '(or first frame)' : '(input)'
                      }
                      objectKey="interpolImageFirst"
                      onNewErrorMsg={onNewErrorMsg}
                      setValue={setValue}
                      interpolImage={interpolImageFirst}
                      orientation={orientation}
                    />
                    {process.env.NEXT_PUBLIC_VEO_ADVANCED_ENABLED === 'true' && (
                      <>
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
                      </>
                    )}
                  </Stack>
                  {process.env.NEXT_PUBLIC_VEO_ADVANCED_ENABLED === 'true' && (
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
                  )}
                </AccordionDetails>
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
                  label={subImgStyleField(control).label}
                  control={control}
                  setValue={setValue}
                  width="400px"
                  field={subImgStyleField(control)}
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
