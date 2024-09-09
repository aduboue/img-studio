'use client'

import * as React from 'react'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import GenerateForm from 'app/ui/generate-form'
import { useState } from 'react'
import { ImageI } from '../../api/imagen-generate/generate-utils'
import StandardImageList from '@/app/ui/image-display'

export default function Page() {
  const [generatedImagesInGCS, setGeneratedImagesInGCS] = useState<ImageI[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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

  return (
    <Box p={5} sx={{ maxHeight: '100vh' }}>
      <Grid wrap="nowrap" container spacing={6} direction="row" columns={2}>
        <Grid size={1.1} sx={{ maxWidth: 700, minWidth: 610 }}>
          <GenerateForm
            isLoading={isLoading}
            onRequestSent={handleRequestSent}
            onImageGeneration={handleImageGeneration}
            onNewErrorMsg={handleNewErrorMsg}
            errorMsg={errorMsg}
          />
        </Grid>
        <Grid size={0.9} sx={{ pt: 11, maxWidth: 850, minWidth: 400 }}>
          <StandardImageList isLoading={isLoading} generatedImagesInGCS={generatedImagesInGCS} />
        </Grid>
      </Grid>
    </Box>
  )
}
