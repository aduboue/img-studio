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

import * as React from 'react'
import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  RadioGroup,
  Slide,
  StepIconProps,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { ImageI } from '../../api/generate-image-utils'
import { TransitionProps } from '@mui/material/transitions'
import { CustomizedSendButton } from '../ux-components/Button-SX'
import {
  ArrowForwardIos,
  ArrowRight,
  Close,
  DownloadForOfflineRounded,
  RadioButtonUncheckedRounded,
  Send,
  WatchLater,
} from '@mui/icons-material'
import { CustomRadio } from '../ux-components/InputRadioButton'

import { ExportMediaFormFieldsI, ExportMediaFormI } from '../../api/export-utils'
import { Controller, set, SubmitHandler, useForm } from 'react-hook-form'
import FormInputChipGroupMultiple from '../ux-components/InputChipGroupMultiple'
import { CloseWithoutSubmitWarning, ExportAlerts } from '../transverse-components/ExportAlerts'

import theme from '../../theme'
import {
  copyImageToTeamBucket,
  downloadMediaFromGcs,
  getVideoThumbnailBase64,
  uploadBase64Image,
} from '../../api/cloud-storage/action'
import { upscaleImage } from '../../api/imagen/action'
import { addNewFirestoreEntry } from '../../api/firestore/action'
import { useAppContext, appContextDataDefault } from '../../context/app-context'
import { VideoI } from '@/app/api/generate-video-utils'

const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export const downloadBase64Media = (base64Data: any, filename: string, format: string) => {
  const link = document.createElement('a')
  link.href = `data:${format};base64,${base64Data}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function ExportStepper({
  open,
  upscaleAvailable,
  mediaToExport,
  handleMediaExportClose,
}: {
  open: boolean
  upscaleAvailable: boolean
  mediaToExport: ImageI | VideoI | undefined
  handleMediaExportClose: () => void
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [isCloseWithoutSubmit, setIsCloseWithoutSubmit] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isDownload, setIsDownload] = useState(false)
  const {
    handleSubmit,
    resetField,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ExportMediaFormI>({
    defaultValues: { upscaleFactor: 'no' },
  })

  useEffect(() => {
    if (mediaToExport) setValue('mediaToExport', mediaToExport)
  }, [mediaToExport])

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
    setIsCloseWithoutSubmit(false)
  }
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
    setIsCloseWithoutSubmit(false)
  }

  const handleCheckDownload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDownload(event.target.checked)
  }

  const { appContext } = useAppContext()
  const exportMediaFormFields = appContext ? appContext.exportMetaOptions : appContextDataDefault.exportMetaOptions

  let metadataReviewFields: any
  var infoToReview: { label: string; value: string }[] = []
  let temp: { [key: string]: ExportMediaFormFieldsI[keyof ExportMediaFormFieldsI] }[] = []
  if (exportMediaFormFields) {
    const exportMediaFieldList: (keyof ExportMediaFormFieldsI)[] = Object.keys(exportMediaFormFields).map(
      (key) => key as keyof ExportMediaFormFieldsI
    )

    metadataReviewFields = exportMediaFieldList.filter(
      (field) =>
        exportMediaFormFields[field].type === 'text-info' &&
        exportMediaFormFields[field].isExportVisible &&
        !exportMediaFormFields[field].isUpdatable
    )
    mediaToExport &&
      metadataReviewFields.forEach((field: any) => {
        const prop = exportMediaFormFields[field].prop
        const value = mediaToExport[prop as keyof (ImageI | VideoI)]
        if (prop && value)
          infoToReview.push({
            label: exportMediaFormFields[field].label,
            value: value.toString(),
          })
      })

    Object.entries(exportMediaFormFields).forEach(([name, field]) => {
      if (field.isUpdatable && field.isExportVisible) temp.push({ [name]: field })
    })
  }
  const MetadataImproveFields = temp

  const handleImageExportSubmit: SubmitHandler<ExportMediaFormI> = React.useCallback(
    async (formData: ExportMediaFormI) => {
      setIsExporting(true)
      setExportStatus('Starting...')

      const media = formData.mediaToExport

      try {
        // 1. Upscale if needed
        let res
        const upscaleFactor = formData.upscaleFactor
        if (upscaleFactor === 'x2' || upscaleFactor === 'x4') {
          try {
            setExportStatus('Upscaling...')

            res = await upscaleImage({ uri: media.gcsUri }, upscaleFactor, appContext)
            if (typeof res === 'object' && 'error' in res && res.error) throw Error(res.error.replaceAll('Error: ', ''))

            media.gcsUri = res.newGcsUri

            media.width = media.width * parseInt(upscaleFactor.replace(/[^0-9]/g, ''))
            media.height = media.height * parseInt(upscaleFactor.replace(/[^0-9]/g, ''))
          } catch (error: any) {
            throw Error(error)
          }
        }

        // 2. Copy media to team library
        const currentGcsUri = media.gcsUri
        const id = media.key
        try {
          setExportStatus('Exporting...')
          const res = await copyImageToTeamBucket(currentGcsUri, id)

          if (typeof res === 'object' && 'error' in res) throw Error(res.error.replaceAll('Error: ', ''))

          const movedGcsUri = res
          media.gcsUri = movedGcsUri
        } catch (error: any) {
          throw Error(error)
        }

        // 2.5. If media is a video, upload its thumbnail
        if (media.format === 'MP4') {
          setExportStatus('Generating thumbnail...')

          const result = await getVideoThumbnailBase64(media.gcsUri, media.ratio)
          if (!result.thumbnailBase64Data) console.error('Failed to generate thumbnail:', result.error)
          const thumbnailBase64Data = result.thumbnailBase64Data

          if (thumbnailBase64Data && process.env.NEXT_PUBLIC_TEAM_BUCKET) {
            try {
              const uploadResult = await uploadBase64Image(
                thumbnailBase64Data,
                process.env.NEXT_PUBLIC_TEAM_BUCKET,
                `${id}_thumbnail.png`,
                'image/png'
              )

              if (uploadResult.success && uploadResult.fileUrl) formData.videoThumbnailGcsUri = uploadResult.fileUrl
              else {
                formData.videoThumbnailGcsUri = ''
                console.warn('Video thumbnail upload failed:', uploadResult.error)
              }
            } catch (thumbError: any) {
              console.error('Video thumbnail upload exception:', thumbError)
            }
          } else
            console.warn(`Video ${id} is a video format but has no thumbnailBase64Data. Skipping thumbnail upload.`)
        }

        // 3. Upload metadata to firestore
        try {
          setExportStatus('Saving data...')

          let res
          if (exportMediaFormFields) res = await addNewFirestoreEntry(id, formData, exportMediaFormFields)
          else throw Error("Can't find exportMediaFormFields")

          if (typeof res === 'object' && 'error' in res) throw Error(res.error.replaceAll('Error: ', ''))
        } catch (error: any) {
          throw Error(error)
        }

        // 4. DL locally if asked to
        if (isDownload) {
          try {
            setExportStatus('Preparing download...')
            const res = await downloadMediaFromGcs(media.gcsUri)
            const name = `${media.key}.${media.format.toLowerCase()}`
            downloadBase64Media(res.data, name, media.format)

            if (typeof res === 'object' && res.error) throw Error(res.error.replaceAll('Error: ', ''))
          } catch (error: any) {
            throw Error(error)
          }
        }

        setExportStatus('')
        setIsExporting(false)
        onClose()
      } catch (error: any) {
        console.log(error)
        setErrorMsg('Error while exporting your image')
      }
    },
    [isDownload]
  )

  const onCloseTry: DialogProps['onClose'] = (
    event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
    reason: string
  ) => {
    if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      event?.stopPropagation()
      setIsCloseWithoutSubmit(true)
    } else {
      onClose()
    }
  }
  const onClose = () => {
    setIsCloseWithoutSubmit(false)
    setActiveStep(0)
    handleMediaExportClose()
    setErrorMsg('')
    setIsExporting(false)
    setExportStatus('')
    setIsDownload(false)
    resetField('mediaToExport')
  }

  function CustomStepIcon(props: StepIconProps) {
    const { active, completed, icon } = props

    return (
      <Typography
        variant="h3"
        component="span"
        sx={{
          color: active ? palette.primary.main : completed ? palette.text.secondary : palette.text.secondary,
          fontWeight: active ? 500 : 'normal',
          fontSize: active ? '1.5rem' : '1.2rem',
        }}
      >
        {icon}
      </Typography>
    )
  }

  function CustomStepLabel({ text, step }: { text: string; step: number }) {
    return (
      <Typography
        color={activeStep === step ? palette.primary.main : palette.secondary.main}
        sx={{ fontWeight: activeStep === step ? 500 : 400, fontSize: activeStep === step ? '1.3rem' : '1.1rem' }}
      >
        {text}
      </Typography>
    )
  }

  const ReviewStep = () => {
    return (
      <Box sx={{ pt: 1, pb: 2, width: '90%' }}>
        {infoToReview.map(({ label, value }) => (
          <Box key={label} display="flex" flexDirection="row">
            <ArrowRight sx={{ color: palette.primary.main, fontSize: '1.2rem', p: 0, mt: 0.2 }} />
            <Box sx={{ pb: 1 }}>
              <Typography display="inline" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{`${label}: `}</Typography>
              <Typography
                display="inline"
                sx={{ fontSize: '0.9rem', color: palette.text.secondary }}
              >{`${value}`}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  const TagStep = () => {
    return (
      <>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 1, width: '85%' }}>
          {'Set up metadata to ensure discoverabilty within shared Library.'}
        </Typography>

        <Box sx={{ py: 2, width: '90%', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {MetadataImproveFields.map((fieldObject) => {
            const param = Object.keys(fieldObject)[0]
            const field = fieldObject[param]

            return (
              <Box key={param} py={1} pl={3} width="100%">
                <FormInputChipGroupMultiple
                  name={param}
                  label={field.label}
                  key={param}
                  control={control}
                  setValue={setValue}
                  width="400"
                  options={field.options}
                  required={field.isMandatory ? field.isMandatory : false}
                />
              </Box>
            )
          })}
        </Box>
      </>
    )
  }

  const isTooLarge = (width: number, height: number) => width > 5000 || height > 5000
  const UpscaleStep = () => {
    return (
      <>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 1, width: '70%' }}>
          {'Upscale resolution to have a sharper and clearer look.'}
        </Typography>
        <Controller
          name="upscaleFactor"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} sx={{ p: 2, pl: 3 }}>
              <CustomRadio
                label="No upscaling"
                subLabel={mediaToExport ? `${mediaToExport.width} x ${mediaToExport.height} px` : ''}
                value="no"
                currentSelectedValue={field.value}
                enabled={true}
              />
              <CustomRadio
                label="Scale x2"
                subLabel={
                  mediaToExport && isTooLarge(mediaToExport.width * 2, mediaToExport.height * 2)
                    ? 'Unavailable, image too large'
                    : `${mediaToExport && mediaToExport.width * 2} x ${mediaToExport && mediaToExport.height * 2} px`
                }
                value="x2"
                currentSelectedValue={field.value}
                enabled={mediaToExport ? !isTooLarge(mediaToExport.width * 2, mediaToExport.height * 2) : true}
              />
              <CustomRadio
                label="Scale x4"
                subLabel={
                  mediaToExport && isTooLarge(mediaToExport.width * 4, mediaToExport.height * 4)
                    ? 'Unavailable, image too large'
                    : `${mediaToExport && mediaToExport.width * 4} x ${mediaToExport && mediaToExport.height * 4} px`
                }
                value="x4"
                currentSelectedValue={field.value}
                enabled={mediaToExport ? !isTooLarge(mediaToExport.width * 4, mediaToExport.height * 4) : true}
              />
            </RadioGroup>
          )}
        />
      </>
    )
  }

  function NextBackBox({ backAvailable }: { backAvailable: boolean }) {
    return (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={<ArrowForwardIos />}
          sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
        >
          {'Next'}
        </Button>
        {backAvailable && (
          <Button onClick={handleBack} sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}>
            {'Back'}
          </Button>
        )}
      </Box>
    )
  }

  const SubmitBox = () => {
    return (
      <>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={isDownload}
              onChange={handleCheckDownload}
              disabled={isExporting}
              icon={<RadioButtonUncheckedRounded sx={{ fontSize: '1.2rem' }} />}
              checkedIcon={<DownloadForOfflineRounded sx={{ fontSize: '1.2rem' }} />}
              sx={{
                '&:hover': { backgroundColor: 'transparent' },
                '&.MuiCheckbox-root:hover': { color: palette.primary.main },
              }}
            />
          }
          label="Download this media locally while exporting"
          disableTypography
          sx={{
            px: 1.5,
            pt: 3,
            '&.MuiFormControlLabel-root': {
              fontSize: '1.1rem',
              alignContent: 'center',
              color: isExporting ? palette.secondary.main : isDownload ? palette.primary.main : palette.text.secondary,
              fontStyle: isExporting ? 'italic' : 'normal',
            },
          }}
        />

        <Box sx={{ m: 0, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isExporting}
            endIcon={isExporting ? <WatchLater /> : <Send />}
            sx={CustomizedSendButton}
          >
            {exportStatus ? exportStatus : 'Export'}
          </Button>

          <Button
            disabled={isExporting}
            onClick={handleBack}
            sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
          >
            {'Back'}
          </Button>
        </Box>
      </>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onCloseTry}
      aria-describedby="parameter the export of the media"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'left',
          p: 1,
          cursor: 'pointer',
          height: '90%',
          maxWidth: '70%',
          width: '40%',
          borderRadius: 1,
          background: 'white',
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={() => setIsCloseWithoutSubmit(true)}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: palette.secondary.dark,
        }}
      >
        <Close sx={{ fontSize: '1.5rem', '&:hover': { color: palette.primary.main } }} />
      </IconButton>
      <DialogContent sx={{ m: 1 }}>
        <DialogTitle sx={{ p: 0, pb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.7rem',
              color: palette.text.primary,
              fontWeight: 400,
              display: 'flex',
              alignContent: 'center',
            }}
          >
            {'Export to internal Library'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit(handleImageExportSubmit)}>
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            sx={{
              backgroundColor: 'transparent',
              '& .MuiStepConnector-line': { minHeight: 0 },
            }}
          >
            <Step key="review">
              <StepLabel StepIconComponent={CustomStepIcon}>
                <CustomStepLabel text="Review metadata" step={0} />
              </StepLabel>
              <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                <ReviewStep />
                <NextBackBox backAvailable={false} />
              </StepContent>
            </Step>

            <Step key="tag">
              <StepLabel StepIconComponent={CustomStepIcon}>
                <CustomStepLabel text="Improve discoverability" step={1} />
              </StepLabel>
              <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                <TagStep />
                {upscaleAvailable && <NextBackBox backAvailable={true} />}
                {!upscaleAvailable && <SubmitBox />}
              </StepContent>
            </Step>

            {upscaleAvailable && (
              <Step key="upscale">
                <StepLabel StepIconComponent={CustomStepIcon}>
                  <CustomStepLabel text="Upscale resolution" step={2} />
                </StepLabel>
                <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                  <UpscaleStep />
                  <SubmitBox />
                </StepContent>
              </Step>
            )}
          </Stepper>
        </form>
      </DialogContent>

      {isCloseWithoutSubmit && (
        <CloseWithoutSubmitWarning onClose={onClose} onKeepOpen={() => setIsCloseWithoutSubmit(false)} />
      )}

      {errorMsg !== '' && (
        <ExportAlerts
          message={errorMsg}
          style="error"
          onClose={() => {
            setIsExporting(false)
            setErrorMsg('')
            setExportStatus('')
          }}
        />
      )}
    </Dialog>
  )
}
