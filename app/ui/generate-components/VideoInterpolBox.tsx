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

import React, { useEffect, useState } from 'react'
import { IconButton, Stack, Typography } from '@mui/material'
import theme from '../../theme'
import ImageDropzone from './ImageDropzone'
import { Clear } from '@mui/icons-material'
import { InterpolImageI } from '@/app/api/generate-video-utils'
const { palette } = theme

export function getOrientation(aspectRatio: string): 'horizontal' | 'vertical' {
  if (!aspectRatio || !aspectRatio.includes(':')) return 'horizontal'

  const parts = aspectRatio.split(':')
  const width = parseFloat(parts[0])
  const height = parseFloat(parts[1])

  if (isNaN(width) || isNaN(height)) return 'horizontal'

  return width >= height ? 'horizontal' : 'vertical'
}

export const VideoInterpolBox = ({
  label,
  sublabel,
  objectKey,
  setValue,
  onNewErrorMsg,
  interpolImage,
  orientation,
}: {
  label: string
  sublabel: string
  objectKey: string
  onNewErrorMsg: (msg: string) => void
  setValue: any
  interpolImage: InterpolImageI
  orientation: string
}) => {
  const initSize = {
    width: '5vw',
    height: '5vw',
  }
  const initMaxSize = {
    width: 70,
    height: 70,
  }
  const [size, setSize] = useState(initSize)
  const [maxSize, setMaxSize] = useState(initMaxSize)

  useEffect(() => {
    if (orientation === '') {
      setSize(initSize)
      setMaxSize(initMaxSize)
    } else {
      if (orientation === 'horizontal') {
        setSize({ width: '7vw', height: '5vw' })
        setMaxSize({ width: 100, height: 70 })
      }
      if (orientation === 'vertical') {
        setSize({ width: '5vw', height: '7vw' })
        setMaxSize({ width: 70, height: 100 })
      }
    }
  }, [orientation])

  return (
    <Stack
      key={objectKey + '_stack'}
      direction="row"
      spacing={0}
      justifyContent="flex-end"
      alignItems="flex-start"
      sx={{ pt: 1, pl: 0, pr: 2 }}
    >
      <Stack direction="column" spacing={0} alignItems="flex-start" sx={{ pr: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: palette.text.primary,
            fontSize: '0.9rem',
            fontWeight: 500,
            lineHeight: '1em',
            pb: 0,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: palette.text.primary,
            fontSize: '0.8rem',
            fontWeight: 400,
            lineHeight: '1.1em',
            pb: 0,
          }}
        >
          {sublabel}
        </Typography>
        {interpolImage.base64Image !== '' && (
          <IconButton
            onClick={() => setValue(`${objectKey}.base64Image`, '')}
            disabled={interpolImage.base64Image === ''}
            disableRipple
            sx={{
              border: 0,
              boxShadow: 0,
              color: palette.secondary.main,
              p: 0,
              '&:hover': {
                backgroundColor: 'transparent',
                border: 0,
                boxShadow: 1,
              },
            }}
          >
            <Clear sx={{ fontSize: '1.3rem' }} />
          </IconButton>
        )}
      </Stack>
      <ImageDropzone
        key={objectKey + '_dropzone'}
        setImage={(base64Image: string) => setValue(`${objectKey}.base64Image`, base64Image)}
        image={interpolImage.base64Image}
        onNewErrorMsg={onNewErrorMsg}
        size={size}
        maxSize={maxSize}
        object={objectKey}
        setValue={setValue}
      />
    </Stack>
  )
}
