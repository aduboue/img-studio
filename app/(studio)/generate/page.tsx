'use client'

import * as React from 'react'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import GenerateForm from '../../ui/generate-form'
import { useState } from 'react'
import { ImageI } from '../../api/generate-utils'
import OutputImagesDisplay from '../../ui/imagen-output-images-display'
import { useAppContext } from '../../context/app-context'
import { Typography } from '@mui/material'

import theme from '../../theme'
const { palette } = theme

export default function Page() {
  const [generatedImagesInGCS, setGeneratedImagesInGCS] = useState<ImageI[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { appContext, error } = useAppContext()

  const handleImageGeneration = (newImages: ImageI[]) => {
    setGeneratedImagesInGCS(newImages)
    setIsLoading(false)
  }

  const handleRequestSent = (valid: boolean) => {
    setIsLoading(valid)
    setErrorMsg('')
  }
  const handleNewErrorMsg = (newErrorMsg: string) => {
    setIsLoading(false)
    setErrorMsg(newErrorMsg)
  }

  if (appContext?.isLoading === true) {
    return (
      <Box p={5}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 400, color: error === null ? palette.primary.main : palette.error.main }}
        >
          {error === null
            ? 'Loading your profile content...'
            : 'Error while loading your profile content! Retry or contact you IT admin.'}
        </Typography>
      </Box>
    )
  } else
    return (
      <Box p={5} sx={{ maxHeight: '100vh' }}>
        <Grid wrap="nowrap" container spacing={6} direction="row" columns={2}>
          <Grid size={1.1} flex={0} sx={{ maxWidth: 700, minWidth: 610 }}>
            <GenerateForm
              isLoading={isLoading}
              onRequestSent={handleRequestSent}
              onImageGeneration={handleImageGeneration}
              onNewErrorMsg={handleNewErrorMsg}
              errorMsg={errorMsg}
            />
          </Grid>
          <Grid size={0.9} flex={1} sx={{ pt: 11, maxWidth: 850, minWidth: 400 }}>
            <OutputImagesDisplay isLoading={isLoading} generatedImagesInGCS={generatedImagesInGCS} />
          </Grid>
        </Grid>
      </Box>
    )
}
