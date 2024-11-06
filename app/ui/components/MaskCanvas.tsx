import { Box } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

const maxWidth = 350
const maxHeight = 550

const calculateImageScaleFactor = (
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight

  let newWidth = Math.min(originalWidth, maxWidth)
  let newHeight = newWidth / aspectRatio
  if (newHeight > maxHeight) {
    newHeight = maxHeight
    newWidth = newHeight * aspectRatio
  }

  return { width: newWidth, height: newHeight }
}

export default function MaskCanvas({
  userUploadedImage,
  maskSize,
  maskImage,
  maskPreview,
  readOnlyCanvas,
  brushSize,
  canvasRef,
  setIsEmptyCanvas,
  isMaskPreview,
}: {
  userUploadedImage: string | null
  maskSize: { width: number; height: number }
  maskImage: string | null
  maskPreview: string | null
  readOnlyCanvas: boolean
  brushSize: number
  canvasRef: React.RefObject<ReactSketchCanvasRef>
  setIsEmptyCanvas: (value: boolean) => void
  isMaskPreview: boolean
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    setCanvasSize({ width: 0, height: 0 })
  }, [])

  const checkIfCanvasIsEmpty = () => {
    if (canvasRef.current) {
      canvasRef.current.exportPaths().then((paths) => {
        if (paths.length === 0) setIsEmptyCanvas(true)
        else setIsEmptyCanvas(false)
      })
    }
  }

  useEffect(() => {
    if (!userUploadedImage && !maskImage) {
      resetImagePreview()
      setCanvasSize({ width: 0, height: 0 })
      checkIfCanvasIsEmpty()
    }
  }, [userUploadedImage, maskImage, maskPreview])

  useEffect(() => {
    checkIfCanvasIsEmpty()
  }, [canvasRef])

  useEffect(() => {
    const loadImage = () => {
      if (userUploadedImage) {
        setImagePreview(userUploadedImage)

        const img = new Image()
        img.onload = () => {
          const { width: newWidth, height: newHeight } = calculateImageScaleFactor(img.width, img.height)
          setCanvasSize({ width: newWidth, height: newHeight })
        }
        img.src = userUploadedImage
      }
    }

    loadImage()

    if (!userUploadedImage) {
      setCanvasSize({ width: 0, height: 0 })
      setImagePreview(null)
    }
  }, [userUploadedImage, calculateImageScaleFactor])

  const resetCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.resetCanvas()
      setIsEmptyCanvas(true)
    }
  }

  const resetImagePreview = () => {
    setImagePreview(null)
    resetCanvas()
  }

  // TODO seg mask doesn't get transformed on the go
  return (
    <Box
      id="CanvasContainer"
      sx={{
        width: '100%',
        minWidth: 400,
        maxWidth: maxWidth,
        height: '100%',
        maxHeight: maxHeight,
        position: 'relative',
        m: 0,
        p: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        overflow: 'scroll',
      }}
    >
      {imagePreview && (
        <Box
          sx={{
            width: canvasSize.width,
            height: canvasSize.height,
            position: 'relative',
          }}
        >
          {!maskImage && (
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={brushSize}
              eraserWidth={brushSize}
              strokeColor="rgba(174, 203, 250, 0.5)"
              canvasColor="transparent"
              readOnly={readOnlyCanvas}
              onChange={checkIfCanvasIsEmpty}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
            />
          )}
          {maskPreview && !isMaskPreview && (
            <img
              src={maskPreview ? maskPreview : ''}
              onError={(e) => console.error('Mask preview loading error:', e)}
              alt="mask image"
              style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}
            />
          )}
          <img
            src={imagePreview}
            alt="preview image"
            style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}
          />
        </Box>
      )}
    </Box>
  )
}

export async function generateMaskFromManualCanvas(canvasMask: string) {
  // Create a new canvas with the same dimensions as the mask
  const scribbleCanvas = document.createElement('canvas')
  const img = new Image()
  img.src = canvasMask

  await new Promise((resolve) => (img.onload = resolve))

  scribbleCanvas.width = img.width
  scribbleCanvas.height = img.height
  const scribbleCtx = scribbleCanvas.getContext('2d')
  if (!scribbleCtx) return

  // Draw the mask onto the canvas
  scribbleCtx.drawImage(img, 0, 0)

  // Get the canvas content
  const imageData = scribbleCtx.getImageData(0, 0, scribbleCanvas.width, scribbleCanvas.height)
  const data = imageData.data

  // Update pixels: transparent becomes black, the rest become white
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]

    if (a === 0) {
      // Transparent pixel, set to black
      data[i] = 0 // R
      data[i + 1] = 0 // G
      data[i + 2] = 0 // B
      data[i + 3] = 255 // A
    } else {
      // Non-transparent pixel, set to white
      data[i] = 255 // R
      data[i + 1] = 255 // G
      data[i + 2] = 255 // B
      data[i + 3] = 255 // A
    }
  }

  // Draw the modified image data back onto the canvas
  scribbleCtx.putImageData(imageData, 0, 0)

  // Convert the canvas content to a data URL
  const base64data = scribbleCanvas.toDataURL('image/png')

  return base64data
}
