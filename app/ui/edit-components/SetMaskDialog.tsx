import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Box,
  Typography,
  Stack,
  RadioGroup,
  Button,
  Icon,
  Alert,
  TextField,
  Avatar,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { Autorenew, Close, Done, WatchLater } from '@mui/icons-material'

import theme from '../../theme'
import MaskCanvas, { generateMaskFromManualCanvas } from './MaskCanvas'
import { CustomRadio } from '../ux-components/InputRadioButton'
import ManualMaskSelection from './ManualMaskSelection'
import { ReactSketchCanvasRef } from 'react-sketch-canvas'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from '../ux-components/Button-SX'
import FormInputDropdownMultiple from '../ux-components/InputDropdownMultiple'
import OutpaintingMaskSettings from './OutpaintingMaskSettings'
import { segmentImage } from '../../api/vertex-seg/action'
import { getAspectRatio } from '../transverse-components/ImageDropzone'
const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

//TODO change any
export default function SetMaskDialog({
  open,
  handleMaskDialogClose,
  availableMaskTypes,
  selectedEditMode,
  maskImage,
  maskPreview,
  setMaskImage,
  setMaskPreview,
  setValue,
  imageToEdit,
  imageSize,
  maskSize,
  setMaskSize,
  setOutpaintedImage,
  outpaintedImage,
}: {
  open: boolean
  handleMaskDialogClose: () => void
  availableMaskTypes: any
  selectedEditMode: any
  maskImage: string | null
  maskPreview: string | null
  setMaskPreview: React.Dispatch<React.SetStateAction<string | null>>
  setMaskImage: React.Dispatch<React.SetStateAction<string | null>>
  setValue: any
  imageToEdit: any
  imageSize: { width: number; height: number; ratio: string }
  maskSize: { width: number; height: number }
  setMaskSize: any
  setOutpaintedImage: any
  outpaintedImage: string
}) {
  const [maskType, setMaskType] = useState(availableMaskTypes[0].value)
  const [maskOptions, setMaskOptions] = useState(
    availableMaskTypes.find((mask: { value: any }) => mask.value === availableMaskTypes[0].value)
  )
  const [semanticSelection, setSemanticSelection] = useState([])
  const [promptSelection, setPromptSelection] = useState('')

  const [isEmptyCanvas, setIsEmptyCanvas] = useState(true)
  const [brushType, setBrushType] = useState('Brush')
  const [brushSize, setBrushSize] = useState(15)

  const [outpaintPosition, setOutpaintPosition] = useState({ horizontal: 'center', vertical: 'center' })
  const [segErrorMsg, setSegErrorMsg] = useState('')
  const [segIsLoading, setSegIsLoading] = useState(false)

  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const outpaintCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!open) {
      setMaskType(availableMaskTypes[0].value)
      setMaskOptions(availableMaskTypes.find((mask: { value: string }) => mask.value === availableMaskTypes[0].value))
      setBrushType('Brush')
      setBrushSize(15)
    }
  }, [open, availableMaskTypes])

  const handleChangeMaskType = (event: { target: { value: string } }) => {
    setMaskType(event.target.value)
    setMaskOptions(availableMaskTypes.find((mask: { value: string }) => mask.value === event.target.value))
    resetSelection()
  }

  const onReset = () => {
    resetSelection()
  }

  const resetSelection = () => {
    setSemanticSelection([])
    setPromptSelection('')
    setMaskImage(null)
    setMaskPreview(null)
    setIsEmptyCanvas(true)
  }

  const handleChangeBrushType = (event: React.MouseEvent<HTMLElement>, newBrushType: string) => {
    if (newBrushType !== null) {
      setBrushType(newBrushType)
      if (newBrushType === 'Eraser') canvasRef.current?.eraseMode(true)
      else canvasRef.current?.eraseMode(false)
    }
  }
  const handleUndoClick = () => canvasRef.current?.undo()
  const handleRedoClick = async () => {
    canvasRef.current?.redo()
    const paths = await canvasRef.current?.exportPaths()
    if (paths && paths.length === 0) setIsEmptyCanvas(true)
  }
  const handleClearClick = () => {
    canvasRef.current?.clearCanvas()
    setIsEmptyCanvas(true)
  }

  const handleSelect = (event: { target: { value: any } }) => {
    const {
      target: { value },
    } = event
    setSemanticSelection(typeof value === 'string' ? value.split(',') : value)
  }

  const requestSent = (valid: boolean) => {
    setSegIsLoading(valid)
    if (valid && segErrorMsg !== '') setSegErrorMsg('')
  }

  const onSegmentation = async () => {
    requestSent(true)

    try {
      const manualMask = await generateManualMask()

      if (!manualMask && maskType === 'interactive') {
        throw Error('No interactive scribble provided')
      }

      const res = await segmentImage(imageToEdit, maskType, semanticSelection, promptSelection, manualMask ?? '')

      if (res !== undefined && typeof res === 'object' && 'error' in res) {
        const msg = res['error'] as string
        const errorMsg = msg.replaceAll('Error: ', '')
        throw Error(errorMsg)
      }
      setMaskImage(res)

      const newMaskPreview = await createMaskPreview(res, maskSize)
      setMaskPreview(newMaskPreview)
    } catch (error: any) {
      setSegErrorMsg(error.toString())
    } finally {
      requestSent(false)
    }
  }

  const generateManualMask = async () => {
    if (!canvasRef.current) return null

    const paths = await canvasRef.current.exportPaths()

    if (paths.length) {
      const dataURL = await canvasRef.current.exportImage('png')
      const img = new Image()
      img.src = dataURL

      await new Promise((resolve) => (img.onload = resolve))

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      const newWidth = imageSize.width
      const newHeight = imageSize.height

      canvas.width = newWidth
      canvas.height = newHeight
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      return new Promise<string | null>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const reader = new FileReader()
            reader.onloadend = async () => {
              const base64data = reader.result as string
              setMaskPreview(base64data)

              const manualMask = await generateMaskFromManualCanvas(base64data)
              if (manualMask) {
                setMaskImage(manualMask)
                resolve(manualMask)
              } else resolve(null)
            }
            reader.readAsDataURL(blob)
          } else resolve(null)
        }, 'image/png')
      })
    } else return null
  }

  const onValidate = async () => {
    if (maskType === 'manual') await generateManualMask()
    if (selectedEditMode.value === 'EDIT_MODE_OUTPAINT') {
      const img = new Image()
      img.onload = () => {
        setValue('width', img.width)
        setValue('height', img.height)
        setValue('ratio', getAspectRatio(img.width, img.height))
      }
      img.src = outpaintedImage
    }
    setPromptSelection('')
    setSemanticSelection([])
    handleMaskDialogClose()
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (segIsLoading) handleMaskDialogClose
      }}
      disableEscapeKeyDown={true}
      aria-describedby="parameter the export of an image"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          display: 'flex',
          justifyContent: 'left',
          alignItems: 'left',
          p: 1,
          cursor: 'pointer',
          height: 'auto',
          minHeight: '75%',
          width: 'auto',
          maxWidth: '70%',
          borderRadius: 1,
          background: 'white',
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={handleMaskDialogClose}
        disabled={segIsLoading}
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
        <>
          {segErrorMsg !== '' && (
            <Alert
              severity="error"
              action={
                <IconButton aria-label="close" color="inherit" size="small" onClick={() => {}} sx={{ pt: 0.2 }}>
                  <Close fontSize="inherit" />
                </IconButton>
              }
              sx={{
                width: '95%',
                height: 'auto',
                mb: 2,
                fontSize: 16,
                fontWeight: 500,
                pt: 1,
                color: palette.text.secondary,
              }}
            >
              {segErrorMsg}
            </Alert>
          )}
        </>
        <Stack justifyContent={'flex-start'} direction="row" gridColumn={2} gap={0} pb={3}>
          <Box sx={{ width: '100%', minWidth: 450, maxWidth: 600, pr: 5 }}>
            <Typography
              sx={{
                fontSize: '1.7rem',
                color: palette.text.primary,
                fontWeight: 400,
                display: 'flex',
                alignContent: 'center',
              }}
            >
              {selectedEditMode.maskDialogTitle}
            </Typography>
            <Typography
              sx={{
                fontSize: '1.1rem',
                color: palette.primary.main,
                fontWeight: 400,
                display: 'flex',
                alignContent: 'center',
              }}
            >
              {selectedEditMode.maskDialogIndication}
            </Typography>
            <RadioGroup onChange={handleChangeMaskType} value={maskType} sx={{ pt: 3 }}>
              {availableMaskTypes.map((mask: { label: string; description: string; value: string }) => (
                <Box key={mask.value} sx={{ pb: 0.5 }}>
                  <CustomRadio
                    label={mask.label}
                    subLabel={mask.description}
                    key={mask.value}
                    value={mask.value ?? ''}
                    currentSelectedValue={maskType}
                    enabled={!segIsLoading}
                  />
                  {maskOptions?.requires === 'manualSelection' && maskType === mask.value && !segIsLoading && (
                    <ManualMaskSelection
                      brushSize={brushSize}
                      brushType={brushType}
                      handleChangeBrushType={handleChangeBrushType}
                      handleChangeBrushSize={(event: any, newValue: number) => setBrushSize(newValue)}
                      handleUndoClick={handleUndoClick}
                      handleRedoClick={handleRedoClick}
                      handleClearClick={handleClearClick}
                    />
                  )}
                  {maskOptions?.requires === 'semanticDropdown' && maskType === mask.value && !segIsLoading && (
                    <Box sx={{ pl: 3.5, pt: 1 }}>
                      <FormInputDropdownMultiple
                        label="Select one or more"
                        width="250px"
                        selectedItems={semanticSelection}
                        handleSelect={handleSelect}
                        handleReset={() => setSemanticSelection([])}
                      />
                    </Box>
                  )}
                  {maskOptions?.requires === 'promptInput' && maskType === mask.value && !segIsLoading && (
                    <Box sx={{ p: 0 }}>
                      <TextField
                        onChange={(event) => setPromptSelection(event.target.value)}
                        value={promptSelection}
                        fullWidth
                        required
                        multiline
                        rows={2}
                        sx={{ pl: 3.5, pt: 1, '& .MuiInputBase-root': { p: 1, fontSize: '0.9rem' } }}
                      />
                    </Box>
                  )}
                  {maskType !== 'manual' && maskType !== 'outpaint' && maskType === mask.value && (
                    <Box sx={{ py: 0, pl: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={onSegmentation}
                        disabled={imageToEdit === null || segIsLoading}
                        endIcon={segIsLoading ? <WatchLater /> : <Icon>{selectedEditMode?.maskButtonIcon}</Icon>}
                        sx={{ ...CustomizedSendButton, fontSize: '0.85rem' }}
                      >
                        {'Trigger'}
                      </Button>
                      <IconButton
                        disabled={segIsLoading}
                        onClick={() => onReset()}
                        aria-label="Reset selection"
                        disableRipple
                        sx={{ px: 0.5 }}
                      >
                        <Avatar sx={CustomizedAvatarButton}>
                          <Autorenew sx={CustomizedIconButton} />
                        </Avatar>
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{
                          color: palette.text.primary,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          lineHeight: '1.3em',
                          pl: 1.5,
                          pb: 0,
                          width: 150,
                        }}
                      >
                        {'(using Vertex Segmentation model)'}
                      </Typography>
                    </Box>
                  )}
                  {maskType === 'outpaint' && maskType === mask.value && (
                    <>
                      <OutpaintingMaskSettings
                        alignHorizontal={outpaintPosition.horizontal}
                        alignVertical={outpaintPosition.vertical}
                        handleHorizontalChange={(event: any, newValue: string) =>
                          setOutpaintPosition({
                            ...outpaintPosition,
                            horizontal: newValue,
                          })
                        }
                        handleVerticalChange={(event: any, newValue: string) =>
                          setOutpaintPosition({
                            ...outpaintPosition,
                            vertical: newValue,
                          })
                        }
                        imageSize={imageSize}
                        maskSize={maskSize}
                        setMaskSize={setMaskSize}
                        outpaintPosition={outpaintPosition}
                        outpaintCanvasRef={outpaintCanvasRef}
                        setMaskImage={setMaskImage}
                        imageToEdit={imageToEdit}
                        setOutpaintedImage={setOutpaintedImage}
                      />
                    </>
                  )}
                </Box>
              ))}
            </RadioGroup>
            <Button
              variant="contained"
              onClick={onValidate}
              disabled={
                imageToEdit === null ||
                segIsLoading ||
                (maskType === 'manual' && isEmptyCanvas) ||
                (maskType === 'outpaint' && maskSize.width === imageSize.width && maskSize.height === imageSize.height)
              }
              endIcon={segIsLoading ? <WatchLater /> : <Done />}
              sx={{ ...CustomizedSendButton, fontSize: '0.85rem', mt: 6, ml: 2 }}
            >
              {'Validate'}
            </Button>
          </Box>
          <MaskCanvas
            imageToEdit={imageToEdit}
            maskSize={maskSize}
            maskImage={maskImage}
            maskPreview={maskPreview}
            readOnlyCanvas={maskOptions?.readOnlyCanvas ?? false}
            brushSize={brushSize}
            canvasRef={canvasRef}
            setIsEmptyCanvas={setIsEmptyCanvas}
            isMaskPreview={selectedEditMode?.value === 'EDIT_MODE_OUTPAINT' || maskType === 'manual'}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export async function createMaskPreview(
  base64Image: string,
  maskSize: { width: number; height: number }
): Promise<string> {
  return new Promise((resolve) => {
    // 1. Decode the Base64 image data (and get the MIME type)
    const [header, imageDataUri] = base64Image.split(',')
    const mimeType = header.match(/:(.*?);/)![1]

    // 2. Create a canvas element with the specified maskSize
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.error('Could not get 2D context for canvas')
      resolve('') // Resolve with an empty string in case of error
      return
    }

    canvas.width = maskSize.width
    canvas.height = maskSize.height

    // 3. Create an Image element and set its src
    const imgElement = new Image()

    // 4. Use onload to ensure the image is loaded before drawing
    imgElement.onload = () => {
      ctx.drawImage(imgElement, 0, 0)

      // 5. Get the image data
      const imgData = ctx.getImageData(0, 0, maskSize.width, maskSize.height)
      const pixels = imgData.data

      // 6. Iterate over the pixels and apply the transformation
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const a = pixels[i + 3]

        if (r === 0 && g === 0 && b === 0 && a === 255) {
          pixels[i + 3] = 128
        } else if (r === 255 && g === 255 && b === 255) {
          pixels[i] = 174
          pixels[i + 1] = 203
          pixels[i + 2] = 250
          pixels[i + 3] = 128
        }
      }

      // 7. Put the modified pixel data back onto the canvas
      ctx.putImageData(imgData, 0, 0)

      // 8. Get the new Base64 encoded image
      const newBase64Image = canvas.toDataURL(mimeType)

      resolve(newBase64Image) // Resolve with the new Base64 image
    }

    imgElement.src = base64Image
  })
}
