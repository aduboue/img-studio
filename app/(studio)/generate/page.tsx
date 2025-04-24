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
import GenerateForm from '../../ui/generate-components/GenerateForm'
import { useEffect, useRef, useState } from 'react'
import { imageGenerationUtils, ImageI, ImageRandomPrompts } from '../../api/generate-image-utils'
import OutputImagesDisplay from '../../ui/transverse-components/ImagenOutputImagesDisplay'
import { useAppContext } from '../../context/app-context'
import { Typography } from '@mui/material'

import theme from '../../theme'
const { palette } = theme
import {
  OperationMetadataI,
  VideoGenerationStatusResult,
  videoGenerationUtils,
  VideoI,
  VideoRandomPrompts,
} from '@/app/api/generate-video-utils'
import { getVideoGenerationStatus } from '@/app/api/veo/action'
import { ChipGroup } from '@/app/ui/ux-components/InputChipGroup'
import OutputVideosDisplay from '@/app/ui/transverse-components/VeoOutputVideosDisplay'

export default function Page() {
  const [generationMode, setGenerationMode] = useState('Generate an Image')

  const [isLoading, setIsLoading] = useState(false)

  const [generatedImages, setGeneratedImages] = useState<ImageI[]>([])
  const [generatedVideos, setGeneratedVideos] = useState<VideoI[]>([])
  const [generatedCount, setGeneratedCount] = useState<number>(0)

  const [generationErrorMsg, setGenerationErrorMsg] = useState('')
  const { appContext, error: appContextError } = useAppContext()

  // Handle 'Replay prompt' from Library
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  useEffect(() => {
    if (appContext && appContext.promptToGenerateImage) {
      setGenerationMode('Generate an Image')
      setInitialPrompt(appContext.promptToGenerateImage)
    }
    if (appContext && appContext.promptToGenerateVideo) {
      setGenerationMode('Generate a Video')
      setInitialPrompt(appContext.promptToGenerateVideo)
    }
  }, [appContext?.promptToGenerateImage, appContext?.promptToGenerateVideo])

  // Video Polling State
  const [pollingOperationName, setPollingOperationName] = useState<string | null>(null)
  const [operationMetadata, setOperationMetadata] = useState<OperationMetadataI | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingAttemptsRef = useRef<number>(0)
  const POLLING_INTERVAL_MS = 10000
  const MAX_POLLING_ATTEMPTS = 40

  // Handler for switching generation mode
  const generationModeSwitch = ({ clickedValue }: { clickedValue: string }) => {
    if (clickedValue !== generationMode && !isLoading) {
      setGenerationMode(clickedValue)
      setGenerationErrorMsg('')
      setGeneratedImages([])
      setGeneratedVideos([])
      // Ensure polling state is reset if switching mode during an errored poll state
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      setPollingOperationName(null)
      setOperationMetadata(null)
    }
  }

  // Handler called when GenerateForm starts ANY request
  const handleRequestSent = (loading: boolean, count: number) => {
    setIsLoading(loading)
    setGenerationErrorMsg('')
    setGeneratedCount(count)
  }

  // Handler called on ANY final error (initial or polling) or polling timeout
  const handleNewErrorMsg = (newErrorMsg: string) => {
    setIsLoading(false)
    setGenerationErrorMsg(newErrorMsg)

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setPollingOperationName(null)
    setOperationMetadata(null)
  }

  // Handler for successful IMAGE generation completion
  const handleImageGeneration = (newImages: ImageI[]) => {
    setGeneratedImages(newImages)
    setIsLoading(false)
    setGeneratedVideos([])
    setGenerationErrorMsg('')
  }

  // Handler for successful VIDEO generation completion (called by polling effect)
  const handleVideoGenerationComplete = (newVideos: VideoI[]) => {
    setGeneratedVideos(newVideos)
    setGeneratedImages([])
    setGenerationErrorMsg('')
    // isLoading is set to false within the polling effect's stopPolling call
  }

  // Handler called by GenerateForm ONLY when video generation is *initiated* successfully
  const handleVideoPollingStart = (operationName: string, metadata: OperationMetadataI) => {
    setPollingOperationName(operationName)
    setOperationMetadata(metadata)
    pollingAttemptsRef.current = 0
    // isLoading should already be true via handleRequestSent
    console.log(`Polling started for operation: ${operationName}`)
  }

  // --- Polling useEffect Hook (Updated) ---
  useEffect(() => {
    // Stop polling and reset loading state
    const stopPolling = (isSuccess: boolean) => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        console.log(`Polling stopped for ${pollingOperationName}. Success: ${isSuccess}`)
      }
      setPollingOperationName(null)
      setOperationMetadata(null)
      setIsLoading(false) // <<< Stop loading when polling ends
    }

    // Function to perform one poll attempt
    const poll = async () => {
      // Guard clause: Ensure we should be polling
      if (!pollingOperationName || !operationMetadata) {
        console.warn('Poll called unexpectedly without operation details.')
        // Attempt to stop cleanly if interval is somehow running
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        setIsLoading(false) // Ensure loading stops
        return
      }

      // Timeout check
      if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        console.error(`Polling timeout for operation: ${pollingOperationName}`)
        handleNewErrorMsg('Video generation timed out. Please check operation status manually.') // Sets error, stops loading
        stopPolling(false) // Ensure interval is cleared even if handler did it
        return
      }

      pollingAttemptsRef.current++
      console.log(`Polling attempt ${pollingAttemptsRef.current} for ${pollingOperationName}`)

      try {
        const statusResult: VideoGenerationStatusResult = await getVideoGenerationStatus(
          pollingOperationName,
          appContext,
          operationMetadata.formData,
          operationMetadata.prompt
        )

        // Check if polling was stopped while waiting for the result
        if (!pollingIntervalRef.current && !statusResult.done) {
          console.log('Polling stopped externally during async operation.')
          return
        }

        if (statusResult.done) {
          if (statusResult.error) {
            console.error(`Polling completed with error: ${statusResult.error}`)
            handleNewErrorMsg(statusResult.error) // Sets error, stops loading
            stopPolling(false)
          } else if (statusResult.videos) {
            console.log(`Polling completed successfully. Videos: ${statusResult.videos.length}`)
            handleVideoGenerationComplete(statusResult.videos) // Sets videos
            stopPolling(true) // Stops polling, sets loading false
          } else {
            console.warn(`Polling done, but no videos or error.`)
            handleNewErrorMsg('Video generation finished, but no results were returned.')
            stopPolling(false)
          }
        }
        // else: Not done, continue polling (interval takes care of next call)
      } catch (error: any) {
        console.error(`Error during polling attempt:`, error.response?.data || error.message || error)

        // Check if polling was stopped externally during async error
        if (!pollingIntervalRef.current) {
          console.log('Polling stopped externally during async error.')
          return
        }
        handleNewErrorMsg('An error occurred while checking the video status. Please try again.')
        stopPolling(false)
      }
    }

    // Start polling only when an operation name is set
    if (pollingOperationName) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current) // Clear previous interval if any
      }
      pollingAttemptsRef.current = 0 // Reset on start
      poll() // Initial poll
      pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL_MS)
      console.log(`Set interval for ${pollingOperationName}`)
    }

    // Cleanup: Clear interval if component unmounts or pollingOperationName becomes null
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        console.log(`Cleaned up interval on effect cleanup for ${pollingOperationName}`)
      }
    }
  }, [pollingOperationName])

  if (appContext?.isLoading === true) {
    return (
      <Box p={5}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 400, color: appContextError === null ? palette.primary.main : palette.error.main }}
        >
          {appContextError === null
            ? 'Loading your profile content...'
            : 'Error while loading your profile content! Retry or contact you IT admin.'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box p={5} sx={{ maxHeight: '100vh' }}>
      <Grid wrap="nowrap" container spacing={6} direction="row" columns={2}>
        <Grid size={1.1} flex={0} sx={{ maxWidth: 700, minWidth: 610 }}>
          {process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' && (
            <ChipGroup
              width={'100%'}
              required={false}
              options={['Generate an Image', 'Generate a Video']}
              value={generationMode}
              disabled={isLoading}
              onChange={generationModeSwitch}
              handleChipClick={generationModeSwitch}
              weight={500}
            />
          )}

          {generationMode === 'Generate an Image' && (
            <GenerateForm
              key="image-form"
              generationType="Image"
              isLoading={isLoading}
              onRequestSent={handleRequestSent}
              onImageGeneration={handleImageGeneration}
              onNewErrorMsg={handleNewErrorMsg}
              errorMsg={generationErrorMsg}
              randomPrompts={ImageRandomPrompts}
              generationFields={imageGenerationUtils}
              initialPrompt={initialPrompt ?? ''}
            />
          )}

          {process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' && generationMode === 'Generate a Video' && (
            <GenerateForm
              key="video-form"
              generationType="Video"
              isLoading={isLoading}
              onRequestSent={handleRequestSent}
              onVideoPollingStart={handleVideoPollingStart}
              onNewErrorMsg={handleNewErrorMsg}
              errorMsg={generationErrorMsg}
              randomPrompts={VideoRandomPrompts}
              generationFields={videoGenerationUtils}
              initialPrompt={initialPrompt ?? ''}
            />
          )}
        </Grid>
        <Grid size={0.9} flex={1} sx={{ pt: 14, maxWidth: 850, minWidth: 400 }}>
          {generationMode === 'Generate an Image' ? (
            <OutputImagesDisplay
              isLoading={isLoading}
              generatedImagesInGCS={generatedImages}
              generatedCount={generatedCount}
            />
          ) : (
            <OutputVideosDisplay
              isLoading={isLoading}
              generatedVideosInGCS={generatedVideos}
              generatedCount={generatedCount}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
