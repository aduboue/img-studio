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

import { Box } from '@mui/material'
import { Canvas, Rect } from 'fabric'
import React, { useCallback, useEffect, useRef } from 'react'
import theme from '../../theme'

const { palette } = theme

const maxWidth = 80
const maxHeight = 150

export function OutpaintPreview({
  maskSize,
  imageSize,
  outpaintPosition,
  outpaintCanvasRef,
  setMaskImage,
  imageToEdit,
  setOutpaintedImage,
}: {
  maskSize: { width: number; height: number }
  imageSize: { width: number; height: number; ratio: string }
  outpaintPosition: { horizontal: string; vertical: string }
  outpaintCanvasRef: React.RefObject<HTMLCanvasElement>
  setMaskImage: (value: string | null) => void
  imageToEdit: string | null
  setOutpaintedImage: (value: string | null) => void
}) {
  const fabricCanvasRef = useRef<Canvas | null>(null)

  useEffect(() => {
    const canvas = outpaintCanvasRef.current
    if (canvas && !fabricCanvasRef.current)
      fabricCanvasRef.current = new Canvas(canvas, { devicePixelRatio: window.devicePixelRatio })

    return () => {
      fabricCanvasRef.current?.dispose()
    }
  }, [])

  const drawMask = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (fabricCanvas) {
      // Calculate scaled mask dimensions
      const maskAspectRatio = maskSize.width / maskSize.height
      let maskWidth = Math.min(maskSize.width, maxWidth)
      let maskHeight = maskWidth / maskAspectRatio

      if (maskHeight > maxHeight) {
        maskHeight = maxHeight
        maskWidth = maskHeight * maskAspectRatio
      }

      fabricCanvas.setDimensions({
        width: maskWidth,
        height: maskHeight,
      })

      fabricCanvas.clear()

      // Calculate scale factor for inner rectangle
      const widthScale = maskWidth / imageSize.width
      const heightScale = maskHeight / imageSize.height

      // Use the smaller scale factor if the aspect ratios are the same,
      // otherwise use the appropriate scale based on the orientation
      let scaleFactor
      if (maskAspectRatio === imageSize.width / imageSize.height) {
        const downScale = imageSize.width / maskSize.width
        scaleFactor = Math.min(widthScale * downScale, heightScale * downScale)
      } else {
        if (maskAspectRatio > imageSize.width / imageSize.height) scaleFactor = heightScale
        else scaleFactor = widthScale
      }

      // Calculate inner rectangle dimensions
      const innerRectWidth = imageSize.width * scaleFactor
      const innerRectHeight = imageSize.height * scaleFactor

      // Calculate inner rectangle position
      let innerRectLeft = 0
      if (outpaintPosition.horizontal === 'left') innerRectLeft = 0
      else if (outpaintPosition.horizontal === 'center') innerRectLeft = (maskWidth - innerRectWidth) / 2
      else if (outpaintPosition.horizontal === 'right') innerRectLeft = maskWidth - innerRectWidth

      let innerRectTop = 0
      if (outpaintPosition.vertical === 'top') innerRectTop = 0
      else if (outpaintPosition.vertical === 'center') innerRectTop = (maskHeight - innerRectHeight) / 2
      else if (outpaintPosition.vertical === 'bottom') innerRectTop = maskHeight - innerRectHeight

      // Create a blue rectangle for the mask
      const rect = new Rect({
        left: 0,
        top: 0,
        width: maskWidth,
        height: maskHeight,
        fill: 'rgba(174, 203, 250, 0.5)',
        objectCaching: false,
        shadow: null,
      })
      fabricCanvas.add(rect)

      // Create a dark grey rectangle
      const innerRect = new Rect({
        left: innerRectLeft,
        top: innerRectTop,
        width: innerRectWidth,
        height: innerRectHeight,
        fill: 'black',
        objectCaching: false,
        shadow: null,
      })
      fabricCanvas.add(innerRect)
    }
  }, [maskSize, imageSize, outpaintPosition])

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current
    if (fabricCanvas) {
      drawMask()

      setTimeout(() => {
        if (maskSize.width !== imageSize.width || maskSize.height !== imageSize.height) {
          generateMaskFromCanvas(maskSize, imageSize, outpaintPosition).then((newMask) => {
            newMask && setMaskImage(newMask)
          })
          generateOutpaintedImageFromCanvas(maskSize, imageToEdit, outpaintPosition).then((newImage) => {
            newImage && setOutpaintedImage(newImage)
          })
        }
      }, 100)
    }
  }, [maskSize, outpaintPosition])

  return (
    <Box
      id="OutpaintContainer"
      sx={{
        width: '100%',
        maxWidth: maxWidth,
        height: '100%',
        maxHeight: maxHeight,
        position: 'relative',
        m: 0,
        px: 0,
        pt: 0.7,
        pb: 0,
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={outpaintCanvasRef}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        }}
      />
    </Box>
  )
}

async function generateMaskFromCanvas(
  maskSize: { width: number; height: number },
  imageSize: { width: number; height: number },
  outpaintPosition: { horizontal: string; vertical: string }
) {
  // Create a new canvas with the desired mask size
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = maskSize.width
  maskCanvas.height = maskSize.height
  const maskCtx = maskCanvas.getContext('2d')

  if (!maskCtx) return

  // Fill the canvas with white
  maskCtx.fillStyle = 'white'
  maskCtx.fillRect(0, 0, maskSize.width, maskSize.height)

  // Calculate position for the black rectangle
  let x = 0
  let y = 0
  if (outpaintPosition.horizontal === 'center') {
    x = (maskSize.width - imageSize.width) / 2
  } else if (outpaintPosition.horizontal === 'right') {
    x = maskSize.width - imageSize.width
  }
  if (outpaintPosition.vertical === 'center') {
    y = (maskSize.height - imageSize.height) / 2
  } else if (outpaintPosition.vertical === 'bottom') {
    y = maskSize.height - imageSize.height
  }

  // Draw the black rectangle with anti-aliasing disabled
  maskCtx.fillStyle = 'black'
  maskCtx.fillRect(x, y, imageSize.width, imageSize.height)

  // Get the canvas content
  const imageData = maskCtx.getImageData(0, 0, maskSize.width, maskSize.height)
  const data = imageData.data

  // Make white pixels transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (r === 255 && g === 255 && b === 255) {
      data[i + 3] = 0 // Set alpha to 0 for transparent
    }
  }

  // Draw the modified image data back onto the canvas
  maskCtx.putImageData(imageData, 0, 0)

  // Convert the canvas content to a data URL
  const base64data = maskCanvas.toDataURL('image/png')

  return base64data
}

async function generateOutpaintedImageFromCanvas(
  maskSize: { width: number; height: number },
  imageToEdit: string | null,
  outpaintPosition: { horizontal: string; vertical: string }
) {
  if (!imageToEdit) return

  // Create a new canvas with the desired mask size
  const outpaintCanvas = document.createElement('canvas')
  outpaintCanvas.width = maskSize.width
  outpaintCanvas.height = maskSize.height
  const outpaintCtx = outpaintCanvas.getContext('2d')
  if (!outpaintCtx) return

  // Fill the canvas with black
  outpaintCtx.fillStyle = 'black'
  outpaintCtx.fillRect(0, 0, maskSize.width, maskSize.height)

  // Load the user uploaded image
  const img = new Image()
  img.src = imageToEdit

  // Ensure the image is loaded before drawing
  await new Promise((resolve) => (img.onload = resolve))

  // Calculate image position based on outpaintPosition
  let x = 0
  let y = 0

  if (outpaintPosition.horizontal === 'center') {
    x = (maskSize.width - img.width) / 2
  } else if (outpaintPosition.horizontal === 'right') {
    x = maskSize.width - img.width
  }

  if (outpaintPosition.vertical === 'center') {
    y = (maskSize.height - img.height) / 2
  } else if (outpaintPosition.vertical === 'bottom') {
    y = maskSize.height - img.height
  }

  // Draw the image on top of the black canvas
  outpaintCtx.drawImage(img, x, y)

  // Convert the canvas content to a data URL
  const base64data = outpaintCanvas.toDataURL('image/png')

  return base64data
}
