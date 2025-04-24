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

import * as React from 'react'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import { useCallback, useEffect, useState } from 'react'
import { ImageI } from '../../api/generate-image-utils'
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
  const [editedCount, setEditedCount] = useState<number>(0)

  const handleImageGeneration = (newImages: ImageI[]) => {
    setEditedImagesInGCS(newImages)
    setIsEditLoading(false)
  }

  const handleRequestSent = (valid: boolean, count: number) => {
    editErrorMsg !== '' && valid && setEditErrorMsg('')
    setIsEditLoading(valid)
    setEditedCount(count)
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
            <OutputImagesDisplay
              isLoading={isEditLoading}
              generatedImagesInGCS={editedImagesInGCS}
              generatedCount={editedCount}
            />
          </Grid>
        </Grid>
      </Box>
    )
  }
}
