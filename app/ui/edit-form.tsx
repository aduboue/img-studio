'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { Typography, Button, Box, IconButton, Stack, Alert, Avatar, Icon } from '@mui/material'
import { Send as SendIcon, WatchLater as WatchLaterIcon, Close as CloseIcon, Autorenew } from '@mui/icons-material'

import { FormInputText } from './components/InputText'
import FormInputDropdown from './components/InputDropdown'

import { ImageI } from '../api/generate-utils'

import theme from '../theme'
import { editImage } from '../api/imagen/action'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from './components/Button-SX'
import CustomTooltip from './components/Tooltip'
import { useAppContext } from '../context/app-context'
import ImageDropzone, { getAspectRatio } from './components/ImageDropzone'
import {
  EditImageFormFields,
  EditImageFormI,
  editSettingsFields,
  formDataEditDefaults,
  maskTypes,
} from '../api/edit-utils'
import FormInputEditSettings from './edit-settings'
import EditModeMenu from './components/EditModeMenu'
import SetMaskDialog from './set-mask-dialog'
import { downloadImage } from '../api/cloud-storage/action'
const { palette } = theme

const editModeField = EditImageFormFields.editMode
const editModeOptions = editModeField.options

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = () => {
      const encoded = Buffer.from(reader.result as ArrayBuffer).toString('base64')
      resolve(encoded)
    }
    reader.onerror = (error) => reject(error)
  })
}

export default function EditForm({
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
  const { handleSubmit, watch, control, setValue, getValues, reset } = useForm<EditImageFormI>({
    defaultValues: formDataEditDefaults,
  })
  const { appContext } = useAppContext()

  //TODO add as part of form?
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)
  const [maskImage, setMaskImage] = useState<string | null>(null)
  const [maskPreview, setMaskPreview] = useState<string | null>(null)
  const [outpaintedImage, setOutpaintedImage] = useState<string | null>(null)

  const [imageWidth, imageHeight, imageRatio] = watch(['width', 'height', 'ratio'])
  const [maskSize, setMaskSize] = useState({ width: 0, height: 0 })

  const defaultEditMode = editModeOptions.find((option) => option.value === editModeField.default)
  const [selectedEditMode, setSelectedEditMode] = useState(defaultEditMode)
  const [openMaskDialog, setOpenMaskDialog] = useState(false)

  const handleNewEditMode = (value: string) => {
    resetStates()
    setValue('editMode', value)
    setSelectedEditMode(editModeOptions.find((option) => option.value === value))
  }

  useEffect(() => {
    if (imageWidth !== maskSize.width || imageHeight !== maskSize.height) {
      setMaskSize({ width: imageWidth, height: imageHeight })
    }
  }, [imageWidth, imageHeight])

  useEffect(() => {
    const fetchAndSetImage = async () => {
      handleNewEditMode(defaultEditMode?.value ?? '')
      if (appContext && appContext.imageToEdit) {
        try {
          const { image } = await downloadImage(appContext.imageToEdit)
          const newImage = `data:image/png;base64,${image}`
          image && setImageToEdit(newImage)
          setMaskImage(null)
        } catch (error) {
          console.error('Error fetching image:', error)
        }
      }
    }

    fetchAndSetImage()
  }, [appContext?.imageToEdit])

  const handleMaskDialogOpen = () => {
    if (imageWidth !== maskSize.width || imageHeight !== maskSize.width)
      setMaskSize({ width: imageWidth, height: imageHeight })
    setMaskImage(null)
    setMaskPreview(null)
    setOpenMaskDialog(true)
  }
  const handleMaskDialogClose = () => {
    setOpenMaskDialog(false)
  }

  useEffect(() => {
    if (imageToEdit) setValue('inputImage', imageToEdit)
    if (outpaintedImage) setValue('inputImage', outpaintedImage)
    if (maskImage) setValue('inputMask', maskImage)
  }, [imageToEdit, maskImage, outpaintedImage])

  const onSubmit: SubmitHandler<EditImageFormI> = async (formData: EditImageFormI) => {
    onRequestSent(true)

    try {
      //TODO first check if mandatory value are here: mask, image, prompt

      const newEditedImage = await editImage(formData, appContext)

      if (newEditedImage !== undefined && typeof newEditedImage === 'object' && 'error' in newEditedImage) {
        const errorMsg = newEditedImage['error'].replaceAll('Error: ', '')
        throw Error(errorMsg)
      } else {
        newEditedImage.map((image) => {
          if ('warning' in image) onNewErrorMsg(image['warning'] as string)
        })

        onImageGeneration(newEditedImage)
      }
    } catch (error: any) {
      onNewErrorMsg(error.toString())
    } finally {
      onRequestSent(false)
    }
  }

  const onReset = () => {
    setImageToEdit(null)
    resetStates()
    reset()
  }

  const resetStates = () => {
    setValue('prompt', '')
    setMaskImage(null)
    setMaskPreview(null)
    setOutpaintedImage(null)
    setMaskSize({ width: 0, height: 0 })
    onNewErrorMsg('')
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ pb: 5 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
            <Typography variant="h1" color={palette.text.secondary} sx={{ fontSize: '1.8rem' }}>
              {'Edit with'}
            </Typography>
            <FormInputDropdown
              name="modelVersion"
              label=""
              control={control}
              field={EditImageFormFields.modelVersion as any}
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
                    onNewErrorMsg('')
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

        <EditModeMenu handleNewEditMode={handleNewEditMode} selectedEditMode={selectedEditMode} />

        <Box sx={{ pb: 4 }}>
          <ImageDropzone
            setImageToEdit={setImageToEdit}
            imageToEdit={imageToEdit}
            setValue={setValue}
            setMaskSize={setMaskSize}
            maskSize={maskSize}
            setMaskImage={setMaskImage}
            maskImage={maskImage}
            maskPreview={maskPreview}
            isOutpaintingMode={selectedEditMode?.value === 'EDIT_MODE_OUTPAINT'}
            outpaintedImage={outpaintedImage}
            setErrorMsg={onNewErrorMsg}
          />
        </Box>

        {selectedEditMode?.promptIndication && (
          <FormInputText
            name="prompt"
            control={control}
            label={selectedEditMode?.promptIndication ?? ''}
            required={selectedEditMode?.mandatoryPrompt}
            rows={2}
          />
        )}

        <Stack
          justifyContent={selectedEditMode?.promptIndication ? 'flex-end' : 'flex-start'}
          direction="row"
          gap={0}
          pb={3}
        >
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
          <FormInputEditSettings control={control} setValue={setValue} editSettingsFields={editSettingsFields} />
          {selectedEditMode?.mandatoryMask && selectedEditMode?.maskType && (
            <Button
              variant="contained"
              onClick={handleMaskDialogOpen}
              disabled={imageToEdit === null || isLoading}
              endIcon={isLoading ? <WatchLaterIcon /> : <Icon>{selectedEditMode?.maskButtonIcon}</Icon>}
              sx={CustomizedSendButton}
            >
              {selectedEditMode?.maskButtonLabel}
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={(maskImage === null && selectedEditMode?.mandatoryMask) || imageToEdit === null || isLoading}
            endIcon={isLoading ? <WatchLaterIcon /> : <SendIcon />}
            sx={CustomizedSendButton}
          >
            {'Edit'}
          </Button>
        </Stack>
      </form>

      {selectedEditMode?.maskType && (
        <SetMaskDialog
          handleMaskDialogClose={handleMaskDialogClose}
          availableMaskTypes={maskTypes.filter((maskType) => selectedEditMode?.maskType.includes(maskType.value))}
          open={openMaskDialog}
          selectedEditMode={selectedEditMode}
          maskImage={maskImage}
          setMaskImage={setMaskImage}
          maskPreview={maskPreview}
          setMaskPreview={setMaskPreview}
          setValue={setValue}
          imageToEdit={imageToEdit}
          imageSize={{ width: imageWidth, height: imageHeight, ratio: imageRatio }}
          maskSize={maskSize}
          setMaskSize={setMaskSize}
          setOutpaintedImage={setOutpaintedImage}
          outpaintedImage={outpaintedImage ?? ''}
        />
      )}
    </>
  )
}
