'use client'

import * as React from 'react'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import { useCallback, useEffect, useState } from 'react'
import { ImageI } from '../../api/generate-utils'
import OutputImagesDisplay from '../../ui/transverse-components/ImagenOutputImagesDisplay'
import { useAppContext } from '../../context/app-context'
import { Typography } from '@mui/material'

import theme from '../../theme'
import EditForm from '@/app/ui/edit-components/EditForm'
import { redirect } from 'next/navigation'
const { palette } = theme

export default function Page() {
  const [editedImagesInGCS, setEditedImagesInGCS] = useState<ImageI[]>([])
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [editErrorMsg, setEditErrorMsg] = useState('')
  const { appContext, error } = useAppContext()

  const handleImageGeneration = (newImages: ImageI[]) => {
    setEditedImagesInGCS(newImages)
    setIsEditLoading(false)
  }

  const handleResetForm = () => {
    setEditedImagesInGCS([])
    setIsEditLoading(false)
  }

  const handleRequestSent = (valid: boolean) => {
    editErrorMsg !== '' && valid && setEditErrorMsg('')
    setIsEditLoading(valid)
  }
  const handleNewErrorMsg = useCallback((newErrorMsg: string) => {
    setEditErrorMsg(newErrorMsg)
    setIsEditLoading(false)
  }, [])

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
  } else if (process.env.NEXT_PUBLIC_EDIT_ENABLED === 'false') {
    redirect('/generate')
  } else {
    return (
      <Box p={5} sx={{ maxHeight: '100vh' }}>
        <Grid wrap="nowrap" container spacing={6} direction="row" columns={2}>
          <Grid size={1.1} flex={0} sx={{ maxWidth: 700, minWidth: 610 }}>
            <EditForm
              isLoading={isEditLoading}
              onRequestSent={handleRequestSent}
              onImageGeneration={handleImageGeneration}
              onNewErrorMsg={handleNewErrorMsg}
              errorMsg={editErrorMsg}
            />
          </Grid>
          <Grid size={0.9} flex={1} sx={{ pt: 11, maxWidth: 850, minWidth: 400 }}>
            <OutputImagesDisplay isLoading={isEditLoading} generatedImagesInGCS={editedImagesInGCS} />
          </Grid>
        </Grid>
      </Box>
    )
  }
}
