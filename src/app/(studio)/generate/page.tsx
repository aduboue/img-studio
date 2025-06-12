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
import { appContextDataDefault, useAppContext } from '../../context/app-context'
import { Typography } from '@mui/material'

import theme from '../../theme'
const { palette } = theme
import {
  InterpolImageI,
  OperationMetadataI,
  VideoGenerationStatusResult,
  videoGenerationUtils,
  VideoI,
  VideoRandomPrompts,
} from '@/app/api/generate-video-utils'
import { getVideoGenerationStatus } from '@/app/api/veo/action'
import { ChipGroup } from '@/app/ui/ux-components/InputChipGroup'
import OutputVideosDisplay from '@/app/ui/transverse-components/VeoOutputVideosDisplay'
import { downloadMediaFromGcs } from '@/app/api/cloud-storage/action'
import { getAspectRatio } from '@/app/ui/edit-components/EditImageDropzone'

// Video Polling Constants
const INITIAL_POLLING_INTERVAL_MS = 6000 // Start polling after 6 seconds
const MAX_POLLING_INTERVAL_MS = 60000 // Max interval 60 seconds
const BACKOFF_FACTOR = 1.2 // Increase interval by 20% each time
const MAX_POLLING_ATTEMPTS = 30 // Max 30 attempts
const JITTER_FACTOR = 0.2 // Add up to 20% jitter

export default function Page() {
  const [generationMode, setGenerationMode] = useState('Generate an Image')

  const [isLoading, setIsLoading] = useState(false)

  const [generatedImages, setGeneratedImages] = useState<ImageI[]>([])
  const [generatedVideos, setGeneratedVideos] = useState<VideoI[]>([])
  const [generatedCount, setGeneratedCount] = useState<number>(0)

  const [generationErrorMsg, setGenerationErrorMsg] = useState('')
  const { appContext, error: appContextError, setAppContext } = useAppContext()

  // Handle 'Replay prompt' from Library
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  useEffect(() => {
    if (appContext && appContext.promptToGenerateImage) {
      setGenerationMode('Generate an Image')
      setInitialPrompt(appContext.promptToGenerateImage)
      // Re-initialize parameter in context
      setAppContext((prevContext) => {
        if (prevContext) return { ...prevContext, promptToGenerateImage: '' }
        else return { ...appContextDataDefault, promptToGenerateImage: '' }
      })
    }
    if (appContext && appContext.promptToGenerateVideo) {
      setGenerationMode('Generate a Video')
      setInitialPrompt(appContext.promptToGenerateVideo)
      // Re-initialize parameter in context
      setAppContext((prevContext) => {
        if (prevContext) return { ...prevContext, promptToGenerateVideo: '' }
        else return { ...appContextDataDefault, promptToGenerateVideo: '' }
      })
    }
  }, [appContext?.promptToGenerateImage, appContext?.promptToGenerateVideo])

  // Handle Image to video from generated or edited image
  const [initialITVimage, setInitialITVimage] = useState<InterpolImageI | null>(null)
  useEffect(() => {
    const fetchAndSetImage = async () => {
      if (appContext && appContext.imageToVideo) {
        setGenerationMode('Generate a Video')
        try {
          const { data } = await downloadMediaFromGcs(appContext.imageToVideo)
          const newImage = `data:image/png;base64,${data}`

          const img = new window.Image()

          img.onload = () => {
            const width = img.width
            const height = img.height
            const ratio = getAspectRatio(img.width, img.height)

            const initialITVimage = {
              format: 'png',
              base64Image: newImage,
              purpose: 'first',
              ratio: ratio,
              width: width,
              height: height,
            }

            data && setInitialITVimage(initialITVimage as InterpolImageI)

            // Re-initialize parameter in context
            setAppContext((prevContext) => {
              if (prevContext) return { ...prevContext, imageToVideo: '' }
              else return { ...appContextDataDefault, imageToVideo: '' }
            })
          }

          img.onerror = () => {
            throw Error('Error loading image for dimension calculation.')
          }

          img.src = newImage
        } catch (error) {
          console.error('Error fetching image:', error)
        }
      }
    }

    fetchAndSetImage()
  }, [appContext?.imageToVideo])

  // Video Polling State
  const [pollingOperationName, setPollingOperationName] = useState<string | null>(null)
  const [operationMetadata, setOperationMetadata] = useState<OperationMetadataI | null>(null)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const pollingAttemptsRef = useRef<number>(0)
  const currentPollingIntervalRef = useRef<number>(INITIAL_POLLING_INTERVAL_MS)

  // Handler for switching generation mode
  const generationModeSwitch = ({ clickedValue }: { clickedValue: string }) => {
    if (clickedValue !== generationMode && !isLoading) {
      setGenerationMode(clickedValue)
      setGenerationErrorMsg('')
      setGeneratedImages([])
      setGeneratedVideos([])
      setInitialPrompt(null)
      // Ensure polling state is reset if switching mode
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      setPollingOperationName(null)
      setOperationMetadata(null)
      setIsLoading(false)

      if (clickedValue === 'Generate an Image') setInitialITVimage(null)
    }
  }

  // Handler called when GenerateForm starts ANY request
  const handleRequestSent = (loading: boolean, count: number) => {
    setIsLoading(loading)
    setGenerationErrorMsg('')
    setGeneratedCount(count)
    setGeneratedImages([])
    setGeneratedVideos([])
  }

  // Handler called on ANY final error (initial or polling) or polling timeout
  const handleNewErrorMsg = (newErrorMsg: string) => {
    setIsLoading(false)
    setGenerationErrorMsg(newErrorMsg)

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
    setPollingOperationName(null) // Stop further polling by clearing operation name
    setOperationMetadata(null)
  }

  // Handler for successful IMAGE generation completion
  const [isPromptReplayAvailable, setIsPromptReplayAvailable] = useState(true)
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

  // Handler called by GenerateForm ONLY when video generation is initiated successfully
  const handleVideoPollingStart = (operationName: string, metadata: OperationMetadataI) => {
    // Clear any existing polling timeout if a new generation starts
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
    setPollingOperationName(operationName)
    setOperationMetadata(metadata)
    pollingAttemptsRef.current = 0
    currentPollingIntervalRef.current = INITIAL_POLLING_INTERVAL_MS
    // setIsLoading(true) is handled by onRequestSent
  }

  // Video generation polling useEffect
  useEffect(() => {
    // Stop polling and reset relevant states
    const stopPolling = (isSuccess: boolean, finalLoadingState = false) => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }

      setIsLoading(finalLoadingState)
    }

    // Function to perform one poll attempt
    const poll = async () => {
      if (!pollingOperationName || !operationMetadata) {
        console.warn('Poll called without active operation details.')
        stopPolling(false, false)
        return
      }

      // Timeout check
      if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        console.error(`Polling timeout for operation: ${pollingOperationName} after ${MAX_POLLING_ATTEMPTS} attempts.`)
        handleNewErrorMsg(
          `Video generation timed out after ${MAX_POLLING_ATTEMPTS} attempts. Please check operation status manually or try again.`
        )

        return
      }

      pollingAttemptsRef.current++

      try {
        const statusResult: VideoGenerationStatusResult = await getVideoGenerationStatus(
          pollingOperationName,
          appContext,
          operationMetadata.formData,
          operationMetadata.prompt
        )

        // If pollingOperationName became null while waiting (e.g., user switched mode or cancelled)
        if (!pollingOperationName) {
          console.log('Polling stopped externally (operation name cleared) during async operation.')
          stopPolling(false, false)
          return
        }

        if (statusResult.done) {
          if (statusResult.error) {
            handleNewErrorMsg(statusResult.error)
          } else if (statusResult.videos && statusResult.videos.length > 0) {
            handleVideoGenerationComplete(statusResult.videos)
            stopPolling(true, false)
            setPollingOperationName(null)
            setOperationMetadata(null)
          } else {
            console.warn(
              `Polling done, but no videos or error for ${pollingOperationName}. Videos array empty or undefined.`
            )
            handleNewErrorMsg('Video generation finished, but no valid results were returned.')
          }
        } else {
          // Not done, schedule next poll with exponential backoff
          const jitter = currentPollingIntervalRef.current * JITTER_FACTOR * (Math.random() - 0.5) // Symmetrical jitter
          const nextInterval = Math.round(currentPollingIntervalRef.current + jitter)

          timeoutIdRef.current = setTimeout(poll, nextInterval)

          // Increase interval for the subsequent attempt
          currentPollingIntervalRef.current = Math.min(
            currentPollingIntervalRef.current * BACKOFF_FACTOR,
            MAX_POLLING_INTERVAL_MS
          )
        }
      } catch (error: any) {
        console.error(
          `Error during polling attempt ${pollingAttemptsRef.current} for ${pollingOperationName}:`,
          error.response?.data || error.message || error
        )
        if (!pollingOperationName) {
          // Check if polling was stopped externally
          console.log('Polling stopped externally (operation name cleared) during async error handling.')
          stopPolling(false, false)
          return
        }
        // Use error.message if available, otherwise a generic fallback
        const errorMessage = error.message || 'An unexpected error occurred while checking the video status.'
        handleNewErrorMsg(errorMessage)
      }
    }

    // Start polling only when an operation name is set and no timeout is currently active
    if (pollingOperationName && !timeoutIdRef.current) {
      // Resetting attempts and interval is now done in handleVideoPollingStart
      // pollingAttemptsRef.current = 0;
      // currentPollingIntervalRef.current = INITIAL_POLLING_INTERVAL_MS;

      // Initial poll, subsequent polls are scheduled by poll() itself via setTimeout
      timeoutIdRef.current = setTimeout(poll, currentPollingIntervalRef.current)
    }

    // Cleanup: Clear timeout if component unmounts or pollingOperationName becomes null
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        console.log(
          `Cleaned up active polling timeout on effect cleanup/re-run for ${
            pollingOperationName || 'previous operation'
          }`
        )
        timeoutIdRef.current = null
      }
    }
  }, [pollingOperationName, operationMetadata, appContext])

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
          <ChipGroup
            width={'100%'}
            required={false}
            options={['Generate an Image', 'Generate a Video']}
            value={generationMode}
            disabled={isLoading || process.env.NEXT_PUBLIC_VEO_ENABLED !== 'true'}
            onChange={generationModeSwitch}
            handleChipClick={generationModeSwitch}
            weight={500}
          />

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
              promptIndication={
                'Describe your image: subjects, visual looks, actions, arrangement, setting (time/ place/ weather), style, lighting, colors, mood'
              }
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
              initialITVimage={initialITVimage ?? undefined}
              promptIndication={
                'Describe your video: subjects, visual looks, actions, arrangement, movements, camera motion, setting (time/ place/ weather), style, lighting, colors, mood'
              }
            />
          )}
        </Grid>
        <Grid size={0.9} flex={1} sx={{ pt: 14, maxWidth: 850, minWidth: 400 }}>
          {generationMode === 'Generate an Image' ? (
            <OutputImagesDisplay
              isLoading={isLoading}
              generatedImagesInGCS={generatedImages}
              generatedCount={generatedCount}
              isPromptReplayAvailable={true}
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
