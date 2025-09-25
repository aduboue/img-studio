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
import { useEffect, useRef, useState } from 'react'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import { Typography } from '@mui/material'

import GenerateForm from '../../ui/generate-components/GenerateForm'
import OutputImagesDisplay from '../../ui/transverse-components/ImagenOutputImagesDisplay'
import OutputVideosDisplay from '@/app/ui/transverse-components/VeoOutputVideosDisplay'
import { ChipGroup } from '@/app/ui/ux-components/InputChipGroup'

import { appContextDataDefault, useAppContext } from '../../context/app-context'
import { imageGenerationUtils, ImageI, ImageRandomPrompts } from '../../api/generate-image-utils'
import {
  InterpolImageI,
  OperationMetadataI,
  videoGenerationUtils,
  VideoI,
  VideoRandomPrompts,
} from '@/app/api/generate-video-utils'
import { getVideoGenerationStatus } from '@/app/api/veo/action'
import { downloadMediaFromGcs } from '@/app/api/cloud-storage/action'
import { getAspectRatio } from '@/app/ui/edit-components/EditImageDropzone'
import theme from '../../theme'

// Constants
const { palette } = theme
const INITIAL_POLLING_INTERVAL_MS = 6000
const MAX_POLLING_INTERVAL_MS = 60000
const BACKOFF_FACTOR = 1.2
const MAX_POLLING_ATTEMPTS = 30
const JITTER_FACTOR = 0.2

type GenerationMode = 'Generate an Image' | 'Generate a Video'

export default function Page() {
  const [generationMode, setGenerationMode] = useState<GenerationMode>('Generate an Image')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<ImageI[]>([])
  const [generatedVideos, setGeneratedVideos] = useState<VideoI[]>([])
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generationErrorMsg, setGenerationErrorMsg] = useState('')

  const { appContext, error: appContextError, setAppContext } = useAppContext()

  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  const [initialITVimage, setInitialITVimage] = useState<InterpolImageI | null>(null)

  // Polling state
  const [pollingOperation, setPollingOperation] = useState<{ name: string; metadata: OperationMetadataI } | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingAttemptsRef = useRef(0)
  const pollingIntervalRef = useRef(INITIAL_POLLING_INTERVAL_MS)

  // Effect for handling prompts from other pages (e.g., Library)
  useEffect(() => {
    const { promptToGenerateImage, promptToGenerateVideo } = appContext ?? {}
    const prompt = promptToGenerateImage || promptToGenerateVideo
    if (prompt) {
      const isImage = !!promptToGenerateImage
      setGenerationMode(isImage ? 'Generate an Image' : 'Generate a Video')
      setInitialPrompt(prompt)
      setAppContext((prev) => ({
        ...(prev ?? appContextDataDefault),
        promptToGenerateImage: '',
        promptToGenerateVideo: '',
      }))
    }
  }, [appContext?.promptToGenerateImage, appContext?.promptToGenerateVideo, setAppContext])

  // Effect for handling image-to-video from other pages
  useEffect(() => {
    if (!appContext?.imageToVideo) return

    const fetchAndSetImage = async (gcsPath: string) => {
      setGenerationMode('Generate a Video')
      try {
        const { data } = await downloadMediaFromGcs(gcsPath)
        if (!data) throw new Error('No image data returned from storage.')

        const imageSrc = `data:image/png;base64,${data}`
        const img = new window.Image()
        img.onload = () => {
          setInitialITVimage({
            format: 'png',
            base64Image: imageSrc,
            purpose: 'first',
            ratio: getAspectRatio(img.width, img.height),
            width: img.width,
            height: img.height,
          })
          setAppContext((prev) => ({ ...(prev ?? appContextDataDefault), imageToVideo: '' }))
        }
        img.onerror = () => {
          throw new Error('Error loading image for dimension calculation.')
        }
        img.src = imageSrc
      } catch (error) {
        console.error('Error fetching image for ITV:', error)
        setGenerationErrorMsg(
          `Failed to load image for video generation: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    fetchAndSetImage(appContext.imageToVideo)
  }, [appContext?.imageToVideo, setAppContext])

  const stopPolling = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    setPollingOperation(null)
  }

  // Polling effect for video generation
  useEffect(() => {
    if (!pollingOperation) return

    const poll = async () => {
      if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        setGenerationErrorMsg(`Video generation timed out after ${MAX_POLLING_ATTEMPTS} attempts.`)
        stopPolling()
        return
      }
      pollingAttemptsRef.current++

      try {
        const statusResult = await getVideoGenerationStatus(
          pollingOperation.name,
          appContext,
          pollingOperation.metadata.formData,
          pollingOperation.metadata.prompt
        )

        // If polling was stopped while waiting for status
        if (!pollingTimeoutRef.current) return

        if (statusResult.done) {
          if (statusResult.error) {
            setGenerationErrorMsg(statusResult.error)
          } else if (statusResult.videos?.length) {
            setGeneratedVideos(statusResult.videos)
            setGeneratedImages([])
          } else {
            setGenerationErrorMsg('Video generation finished, but no results were returned.')
          }
          stopPolling()
          setIsLoading(false)
        } else {
          // Not done, schedule next poll
          const jitter = pollingIntervalRef.current * JITTER_FACTOR * (Math.random() - 0.5)
          const nextInterval = Math.round(pollingIntervalRef.current + jitter)
          pollingIntervalRef.current = Math.min(pollingIntervalRef.current * BACKOFF_FACTOR, MAX_POLLING_INTERVAL_MS)
          pollingTimeoutRef.current = setTimeout(poll, nextInterval)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
        setGenerationErrorMsg(`Error checking video status: ${message}`)
        stopPolling()
        setIsLoading(false)
      }
    }

    pollingTimeoutRef.current = setTimeout(poll, pollingIntervalRef.current)

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
        pollingTimeoutRef.current = null
      }
    }
  }, [pollingOperation, appContext])

  const resetGenerationState = (newMode?: GenerationMode) => {
    setIsLoading(false)
    setGenerationErrorMsg('')
    setGeneratedImages([])
    setGeneratedVideos([])
    setGeneratedCount(0)
    setInitialPrompt(null)
    if (newMode === 'Generate an Image' || !newMode) {
      setInitialITVimage(null)
    }
    stopPolling()
  }

  const handleModeSwitch = ({ clickedValue }: { clickedValue: GenerationMode }) => {
    if (clickedValue !== generationMode && !isLoading) {
      setGenerationMode(clickedValue)
      resetGenerationState(clickedValue)
    }
  }

  const handleRequestSent = (loading: boolean, count: number) => {
    setIsLoading(loading)
    setGeneratedCount(count)
    setGenerationErrorMsg('')
    setGeneratedImages([])
    setGeneratedVideos([])
  }

  const handleImageGeneration = (newImages: ImageI[]) => {
    setGeneratedImages(newImages)
    setIsLoading(false)
  }

  const handleVideoPollingStart = (operationName: string, metadata: OperationMetadataI) => {
    // Clear any existing polling WITHOUT changing the loading state
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }

    pollingAttemptsRef.current = 0
    pollingIntervalRef.current = INITIAL_POLLING_INTERVAL_MS
    setPollingOperation({ name: operationName, metadata })
  }

  const handleNewError = (newErrorMsg: string) => {
    setGenerationErrorMsg(newErrorMsg)
    stopPolling()
    setIsLoading(false)
  }

  if (appContext?.isLoading) {
    return (
      <Box p={5}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 400, color: appContextError ? palette.error.main : palette.primary.main }}
        >
          {appContextError
            ? 'Error loading your profile content! Retry or contact you IT admin.'
            : 'Loading your profile content...'}
        </Typography>
      </Box>
    )
  }

  const isImageMode = generationMode === 'Generate an Image'
  const isVideoEnabled = process.env.NEXT_PUBLIC_VEO_ENABLED === 'true'

  const commonFormProps = {
    isLoading,
    errorMsg: generationErrorMsg,
    initialPrompt: initialPrompt ?? '',
    onRequestSent: handleRequestSent,
    onNewErrorMsg: handleNewError,
  }

  const imageFormProps = {
    ...commonFormProps,
    generationType: 'Image' as const,
    onImageGeneration: handleImageGeneration,
    randomPrompts: ImageRandomPrompts,
    generationFields: imageGenerationUtils,
    promptIndication:
      'Describe your image: subjects, visual looks, actions, arrangement, setting (time/ place/ weather), style, lighting, colors, mood',
  }

  const videoFormProps = {
    ...commonFormProps,
    generationType: 'Video' as const,
    onVideoPollingStart: handleVideoPollingStart,
    randomPrompts: VideoRandomPrompts,
    generationFields: videoGenerationUtils,
    initialITVimage: initialITVimage ?? undefined,
    promptIndication:
      'Describe your video: subjects, visual looks, actions, arrangement, movements, camera motion, setting (time/ place/ weather), style, lighting, colors, mood',
  }

  return (
    <Box p={5} sx={{ maxHeight: '100vh' }}>
      <Grid wrap="nowrap" container spacing={6} direction="row" columns={2}>
        <Grid size={1.1} flex={0} sx={{ maxWidth: 700, minWidth: 610 }}>
          <ChipGroup
            width="100%"
            required={false}
            options={['Generate an Image', 'Generate a Video']}
            value={generationMode}
            disabled={isLoading || !isVideoEnabled}
            onChange={handleModeSwitch}
            handleChipClick={handleModeSwitch}
            weight={500}
          />

          {isImageMode && <GenerateForm key="image-form" {...imageFormProps} />}
          {isVideoEnabled && !isImageMode && <GenerateForm key="video-form" {...videoFormProps} />}
        </Grid>
        <Grid size={0.9} flex={1} sx={{ pt: 14, maxWidth: 850, minWidth: 400 }}>
          {isImageMode ? (
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
