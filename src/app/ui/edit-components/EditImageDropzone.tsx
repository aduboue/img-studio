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

import { Box, Typography } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import theme from '../../theme'
import { fileToBase64 } from './EditForm'
const { palette } = theme

export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b)
  }

  const divisor = gcd(width, height)
  let widthRatio = width / divisor
  let heightRatio = height / divisor

  const tolerance = 0.05

  const standardRatios = [
    [16, 9],
    [9, 16],
    [4, 3],
    [3, 4],
    [1, 1],
    [3, 2],
    [2, 3],
  ]

  for (const [standardWidth, standardHeight] of standardRatios) {
    const calculatedRatio = widthRatio / heightRatio
    const standardRatio = standardWidth / standardHeight

    if (Math.abs(calculatedRatio - standardRatio) < tolerance) {
      return `${standardWidth}:${standardHeight}`
    }
  }

  // If no standard ratio is found within tolerance, return the simplified ratio
  return `${Math.round(widthRatio)}:${Math.round(heightRatio)}`
}

export function getParentBoxDimensions(selector: string): { maxWidth: number; maxHeight: number } {
  const parentBox = document.querySelector(selector) as HTMLDivElement
  if (!parentBox) {
    console.error('Parent box not found.')
    return { maxWidth: 0, maxHeight: 0 }
  }
  const maxWidth = parentBox.offsetWidth
  const maxHeight = parentBox.offsetHeight
  return { maxWidth, maxHeight }
}

export default function EditImageDropzone({
  setImageToEdit,
  imageToEdit,
  maskImage,
  maskPreview,
  setValue,
  setMaskSize,
  setMaskImage,
  isOutpaintingMode,
  outpaintedImage,
  maskSize,
  setErrorMsg,
}: {
  setImageToEdit: React.Dispatch<React.SetStateAction<string | null>>
  imageToEdit: string | null
  maskImage: string | null
  maskPreview: string | null
  setValue: any
  setMaskSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>
  setMaskImage: React.Dispatch<React.SetStateAction<string | null>>
  isOutpaintingMode: boolean
  outpaintedImage: string | null
  maskSize: { width: number; height: number }
  setErrorMsg: (newErrorMsg: string) => void
}) {
  const [canvasSize, setCanvas] = useState({ width: 0, height: 0 })

  const initiateDimensions = (image: string) => {
    const img = new Image()
    img.onload = () => {
      initializeCanvas(img.width, img.height)
      setValue('width', img.width)
      setValue('height', img.height)
      setValue('ratio', getAspectRatio(img.width, img.height))
      setMaskSize({ width: img.width, height: img.height })
    }
    img.src = image
  }

  const calculateImageScaleFactor = useMemo(
    () =>
      (originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number): number => {
        const scaleFactorWidth = maxWidth / originalWidth
        const scaleFactorHeight = maxHeight / originalHeight
        return Math.min(scaleFactorWidth, scaleFactorHeight)
      },
    []
  )

  const initializeCanvas = (width: number, height: number) => {
    const { maxWidth, maxHeight } = getParentBoxDimensions('#DropzoneContainer')
    const factor = calculateImageScaleFactor(width, height, maxWidth, maxHeight)
    setCanvas({ width: width * factor, height: height * factor })
  }

  const resetImagePreview = () => {
    setImageToEdit(null)
    setMaskImage(null)
    setCanvas({ width: 0, height: 0 })
  }

  useEffect(() => {
    if (isOutpaintingMode && outpaintedImage) {
      initializeCanvas(maskSize.width, maskSize.height)
    } else if (imageToEdit) {
      initiateDimensions(imageToEdit)
    } else if (!imageToEdit && !maskImage) {
      resetImagePreview()
      setCanvas({ width: 0, height: 0 })
      setMaskSize({ width: 0, height: 0 })
      setValue('width', 0)
      setValue('height', 0)
      setValue('ratio', '1:1')
    }
  }, [imageToEdit, maskImage, isOutpaintingMode, outpaintedImage])

  const onDrop = async (acceptedFiles: File[]) => {
    setErrorMsg('')

    const file = acceptedFiles[0]
    const allowedTypes = ['image/png', 'image/webp', 'image/jpeg']

    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Wrong input image format - Only png, jpeg and webp are allowed')
      return
    }

    const base64 = await fileToBase64(file)
    const newImage = `data:${file.type};base64,${base64}`
    setImageToEdit(newImage)
    initiateDimensions(newImage)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <>
      <Box
        id="DropzoneContainer"
        sx={{
          width: '100%',
          height: 300,
          position: 'relative',
          m: 0,
          p: 0,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {!imageToEdit && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'gray',
              border: '1px dotted gray',
              '&:hover': {
                border: '1px solid',
                borderColor: palette.primary.main,
                '& .MuiTypography-root': {
                  color: palette.primary.main,
                  fontWeight: 500,
                },
              },
            }}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <Typography variant="body1">{'Drop or select your image'}</Typography>
          </Box>
        )}
        {imageToEdit && (
          <Box
            sx={{
              position: 'relative',
              width: canvasSize.width,
              height: canvasSize.height,
              display: 'inline-block',
            }}
          >
            <img
              src={imageToEdit}
              alt="preview image"
              style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}
            />
            {(maskImage || maskPreview) && !isOutpaintingMode && (
              <img
                src={maskPreview ? maskPreview : maskImage ? maskImage : ''}
                alt="mask image"
                style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}
              />
            )}
            {outpaintedImage && isOutpaintingMode && (
              <img
                src={outpaintedImage}
                alt="outpaintedImage image"
                style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}
              />
            )}
          </Box>
        )}
      </Box>
    </>
  )
}
