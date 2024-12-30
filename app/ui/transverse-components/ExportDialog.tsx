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
import { ImageI } from '../../api/generate-utils'
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

import { ExportImageFormFieldsI, ExportImageFormI } from '../../api/export-utils'
import { Controller, set, SubmitHandler, useForm } from 'react-hook-form'
import FormInputChipGroupMultiple from '../ux-components/InputChipGroupMultiple'
import { CloseWithoutSubmitWarning, ExportErrorWarning } from '../transverse-components/ExportAlerts'

import theme from '../../theme'
import { copyImageToTeamBucket, downloadImage } from '../../api/cloud-storage/action'
import { upscaleImage } from '../../api/imagen/action'
import { addNewFirestoreEntry } from '../../api/firestore/action'
import { useAppContext, appContextDataDefault } from '../../context/app-context'
const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function ExportStepper({
  open,
  imageToExport,
  handleImageExportClose,
}: {
  open: boolean
  imageToExport: ImageI | undefined
  handleImageExportClose: () => void
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
  } = useForm<ExportImageFormI>({
    defaultValues: { upscaleFactor: imageToExport?.ratio === '1:1' ? 'x4' : 'no' },
  })

  useEffect(() => {
    if (imageToExport) {
      setValue('imageToExport', imageToExport)
    }
  }, [imageToExport])

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

  const downloadBase64Image = (base64Data: any, filename: string) => {
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${base64Data}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { appContext } = useAppContext()
  const ExportImageFormFields = appContext ? appContext.exportFields : appContextDataDefault.exportFields

  let MetadataReviewFields: any
  var infoToReview: { label: string; value: string }[] = []
  let temp: { [key: string]: ExportImageFormFieldsI[keyof ExportImageFormFieldsI] }[] = []
  if (ExportImageFormFields) {
    const ExportImageFieldList: (keyof ExportImageFormFieldsI)[] = Object.keys(ExportImageFormFields).map(
      (key) => key as keyof ExportImageFormFieldsI
    )

    MetadataReviewFields = ExportImageFieldList.filter(
      (field) =>
        ExportImageFormFields[field].type === 'text-info' &&
        ExportImageFormFields[field].isExportVisible &&
        !ExportImageFormFields[field].isUpdatable
    )
    imageToExport &&
      MetadataReviewFields.forEach((field: any) => {
        const prop = ExportImageFormFields[field].prop ? ExportImageFormFields[field].prop : ''
        if (prop !== '')
          infoToReview.push({
            label: ExportImageFormFields[field].label,
            value: imageToExport[prop as keyof ImageI].toString(),
          })
      })

    Object.entries(ExportImageFormFields).forEach(([name, field]) => {
      if (field.isUpdatable && field.isExportVisible) {
        temp.push({ [name]: field })
      }
    })
  }

  const MetadataImproveFields = temp

  const handleImageExportSubmit: SubmitHandler<ExportImageFormI> = React.useCallback(
    async (formData: ExportImageFormI) => {
      setIsExporting(true)
      setExportStatus('Starting...')

      try {
        // 1. Upscale if needed
        let upscaledGcsUri
        const upscaleFactor = formData['upscaleFactor']
        if (upscaleFactor === 'x2' || upscaleFactor === 'x4') {
          try {
            setExportStatus('Upscaling...')

            upscaledGcsUri = await upscaleImage(formData['imageToExport']['gcsUri'], upscaleFactor, appContext)
            if (typeof upscaledGcsUri === 'object' && 'error' in upscaledGcsUri) {
              throw Error(upscaledGcsUri['error'].replaceAll('Error: ', ''))
            }
            formData['imageToExport']['gcsUri'] = upscaledGcsUri

            formData['imageToExport']['width'] =
              formData['imageToExport']['width'] * parseInt(upscaleFactor.replace(/[^0-9]/g, ''))
            formData['imageToExport']['height'] =
              formData['imageToExport']['height'] * parseInt(upscaleFactor.replace(/[^0-9]/g, ''))
          } catch (error: any) {
            throw Error(error)
          }
        }

        // 2. Copy image to team library
        const currentGcsUri = formData['imageToExport']['gcsUri']
        const imageID = formData['imageToExport']['key']
        try {
          setExportStatus('Exporting...')
          const res = await copyImageToTeamBucket(currentGcsUri, imageID)

          if (typeof res === 'object' && 'error' in res) {
            throw Error(res['error'].replaceAll('Error: ', ''))
          }

          const movedGcsUri = res
          formData['imageToExport']['gcsUri'] = movedGcsUri
        } catch (error: any) {
          throw Error(error)
        }

        // 3. Upload metadata to firestore
        try {
          setExportStatus('Saving data...')

          let res
          if (ExportImageFormFields) {
            res = await addNewFirestoreEntry(imageID, formData, ExportImageFormFields)
          } else {
            throw Error("Can't find ExportImageFormFields")
          }

          if (typeof res === 'object' && 'error' in res) {
            throw Error(res['error'].replaceAll('Error: ', ''))
          }
        } catch (error: any) {
          throw Error(error)
        }

        // 4. DL locally if asked to
        if (isDownload) {
          try {
            setExportStatus('Preparing download...')
            const res = await downloadImage(formData['imageToExport']['gcsUri'])
            const imageName = `${formData['imageToExport']['key']}.${formData['imageToExport']['format'].toLowerCase()}`
            downloadBase64Image(res.image, imageName)

            if (typeof res === 'object' && res['error']) {
              throw Error(res['error'].replaceAll('Error: ', ''))
            }
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
    reason
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
    handleImageExportClose()
    setErrorMsg('')
    setIsExporting(false)
    setExportStatus('')
    setIsDownload(false)
    resetField('imageToExport')
  }
  const isSquareRatio = imageToExport ? imageToExport.ratio === '1:1' : true

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
      <>
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

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForwardIos />}
            sx={{ ...CustomizedSendButton, ...{ fontSize: '0.85rem' } }}
          >
            {'Next'}
          </Button>
        </Box>
      </>
    )
  }

  const TagStep = () => {
    return (
      <>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 1, width: '85%' }}>
          {'Set up metadata to better make your image discoverable within the shared Library.'}
        </Typography>

        <Box sx={{ py: 2, width: '90%', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {MetadataImproveFields.map((fieldObject) => {
            const param = Object.keys(fieldObject)[0] // Get the key (param) from the object
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

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForwardIos />}
            sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
          >
            {'Next'}
          </Button>
          <Button onClick={handleBack} sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}>
            {'Back'}
          </Button>
        </Box>
      </>
    )
  }

  const UpscaleStep = () => {
    return (
      <>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 1, width: '70%' }}>
          {'Upscale your image resolution to make it look sharper and clearer.'}
        </Typography>
        <Controller
          name="upscaleFactor"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} sx={{ p: 2 }}>
              <CustomRadio
                label="No upscaling"
                subLabel={imageToExport ? `${imageToExport.width} x ${imageToExport.height} px` : ''}
                value="no"
                currentSelectedValue={field.value}
                enabled={true}
              />
              <CustomRadio
                label="Scale x2"
                subLabel={`${imageToExport && imageToExport.width * 2} x ${
                  imageToExport && imageToExport.height * 2
                } px`}
                value="x2"
                currentSelectedValue={field.value}
                enabled={true}
              />
              <CustomRadio
                label="Scale x4"
                subLabel={`${imageToExport && imageToExport.width * 4} x ${
                  imageToExport && imageToExport.height * 4
                } px`}
                value="x4"
                currentSelectedValue={field.value}
                enabled={true}
              />
            </RadioGroup>
          )}
        />

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForwardIos />}
            sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
          >
            {'Next'}
          </Button>
          <Button onClick={handleBack} sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}>
            {'Back'}
          </Button>
        </Box>
      </>
    )
  }

  const ExportStep = () => {
    return (
      <>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={isDownload}
              onChange={handleCheckDownload}
              disabled={isExporting}
              icon={<RadioButtonUncheckedRounded sx={{ fontSize: '1.4rem' }} />}
              checkedIcon={<DownloadForOfflineRounded sx={{ fontSize: '1.4rem' }} />}
              sx={{
                '&:hover': { backgroundColor: 'transparent' },
                '&.MuiCheckbox-root:hover': { color: palette.primary.main },
              }}
            />
          }
          label="Download image locally as well"
          disableTypography
          sx={{ px: 1.5, pt: 1, '&.MuiFormControlLabel-root': { fontSize: '1.1rem', alignContent: 'center' } }}
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
      aria-describedby="parameter the export of an image"
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
              </StepContent>
            </Step>

            <Step key="tag">
              <StepLabel StepIconComponent={CustomStepIcon}>
                <CustomStepLabel text="Improve discoverability" step={1} />
              </StepLabel>
              <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                <TagStep />
              </StepContent>
            </Step>
            <Step key="upscale">
              <StepLabel StepIconComponent={CustomStepIcon}>
                <CustomStepLabel text="Upscale resolution" step={2} />
              </StepLabel>
              <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                <UpscaleStep />
              </StepContent>
            </Step>
            <Step key="export">
              <StepLabel StepIconComponent={CustomStepIcon}>
                <CustomStepLabel text="Ready to export!" step={3} />
              </StepLabel>
              <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                <ExportStep />
              </StepContent>
            </Step>
          </Stepper>
        </form>
      </DialogContent>

      {isCloseWithoutSubmit && (
        <CloseWithoutSubmitWarning onClose={onClose} onKeepOpen={() => setIsCloseWithoutSubmit(false)} />
      )}

      {errorMsg !== '' && (
        <ExportErrorWarning
          errorMsg={errorMsg}
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
