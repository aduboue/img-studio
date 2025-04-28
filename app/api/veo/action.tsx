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

'use server'

import { decomposeUri, getSignedURL } from '../cloud-storage/action'
import { rewriteWithGemini } from '../gemini/action'
import { appContextDataI } from '../../context/app-context'
import {
  GenerateVideoFormI,
  videoGenerationUtils,
  VideoI,
  GenerateVideoFormFields,
  ErrorResult,
  GenerateVideoInitiationResult,
  PollingResponse,
  VideoGenerationStatusResult,
  VideoRatioToPixel,
  BuildVideoListParams,
  ProcessedVideoResult,
} from '../generate-video-utils'
import { normalizeSentence } from '../imagen/action'
const { GoogleAuth } = require('google-auth-library')

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
}

async function generatePrompt(formData: any, isGeminiRewrite: boolean) {
  let fullPrompt = formData['prompt']

  // Rewrite the content of the prompt
  if (isGeminiRewrite) {
    try {
      const geminiReturnedPrompt = await rewriteWithGemini(fullPrompt, 'Video')

      if (typeof geminiReturnedPrompt === 'object' && 'error' in geminiReturnedPrompt) {
        const errorMsg = cleanResult(JSON.stringify(geminiReturnedPrompt['error']).replaceAll('Error: ', ''))
        throw Error(errorMsg)
      } else fullPrompt = geminiReturnedPrompt as string
    } catch (error) {
      console.error(error)
      return { error: 'Error while rewriting prompt with Gemini .' }
    }
  }

  // Add the photo/ art/ digital style to the prompt
  fullPrompt = `A ${formData['secondary_style']} ${formData['style']} of ` + fullPrompt

  // Add additional parameters to the prompt
  let parameters = ''
  videoGenerationUtils.fullPromptFields.forEach((additionalField) => {
    if (formData[additionalField] !== '')
      parameters += ` ${formData[additionalField]} ${additionalField.replaceAll('_', ' ')}, `
  })
  if (parameters !== '') fullPrompt = `${fullPrompt}, ${parameters}`

  fullPrompt = normalizeSentence(fullPrompt)

  return fullPrompt
}

// Returns only successfully processed VideoI objects
export async function buildVideoListFromURI({
  videosInGCS,
  aspectRatio,
  duration,
  width,
  height,
  usedPrompt,
  userID,
  modelVersion,
  mode,
}: BuildVideoListParams): Promise<VideoI[]> {
  const promises = videosInGCS.map(async (videoResult): Promise<ProcessedVideoResult | null> => {
    // 1. Check for RAI filtering
    const raiReason = (videoResult as any).raiFilteredReason
    if (raiReason) {
      console.warn(`Video filtered due to RAI: ${raiReason}. GCS URI: ${videoResult.gcsUri || 'N/A'}`)
      return { warning: `Video filtered due to RAI: ${raiReason}` }
    }

    // 2. Ensure GCS URI exists - essential for processing
    if (!videoResult.gcsUri) {
      console.warn('Skipping video result due to missing gcsUri.')
      return null
    }

    try {
      // 3. Decompose URI to get filename (assuming utility handles potential errors)
      const { fileName } = await decomposeUri(videoResult.gcsUri)

      // 4. Determine video format from MIME type
      const mimeType = videoResult.mimeType || 'video/mp4'
      const format = mimeType.replace('video/', '').toUpperCase()

      // 5. Generate a unique-ish key/ID (adjust path segments if necessary)
      const ID = fileName
        .replaceAll('/', '')
        .replace(userID, '')
        .replace('generated-videos', '')
        .replace('sample_', '')
        .replace(`.${format.toLowerCase()}`, '')

      // 6. Format the date
      const today = new Date()
      const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

      // 7. Get Signed URL for the video file using the GCS URI
      const signedURLResult: string | { error: string } = await getSignedURL(videoResult.gcsUri)

      // Handle potential errors from getting the signed URL
      if (typeof signedURLResult === 'object' && 'error' in signedURLResult) {
        throw new Error(
          `Failed to get signed URL for ${videoResult.gcsUri}: ${
            cleanResult ? cleanResult(signedURLResult.error) : signedURLResult.error
          }`
        )
      }
      const signedURL = signedURLResult // Assign if successful

      // 8. Construct the final VideoI object with all metadata
      const videoDetails: VideoI = {
        src: signedURL,
        gcsUri: videoResult.gcsUri,
        thumbnailGcsUri: '',
        format: format,
        prompt: usedPrompt,
        altText: `Generated ${format} video`,
        key: ID || Date.now().toString(),
        width: width,
        height: height,
        ratio: aspectRatio,
        duration: duration,
        date: formattedDate,
        author: userID,
        modelVersion: modelVersion,
        mode: mode,
      }
      return videoDetails
    } catch (error) {
      console.error(`Error processing video result ${videoResult.gcsUri}:`, error)
      return {
        error: `Error processing video ${videoResult.gcsUri}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      }
    }
  })

  // Wait for all processing promises to settle
  const processedResults = await Promise.all(promises)

  // Filter out nulls, warnings, and errors, keeping only valid VideoI objects
  const generatedVideosToDisplay = processedResults.filter(
    (
      result
    ): result is VideoI => // Type predicate confirms the result is a VideoI object
      result !== null && typeof result === 'object' && !('error' in result) && !('warning' in result)
  )

  // Log any errors or warnings encountered during the batch processing
  processedResults.forEach((result) => {
    if (result && typeof result === 'object') {
      if ('error' in result) console.error(`Video Processing Error Skipped: ${result.error}`)
      else if ('warning' in result) console.warn(`Video Processing Warning Skipped: ${result.warning}`)
    }
  })

  return generatedVideosToDisplay
}

// Initiates TEXT-TO-VIDEO generation request, returns long-running operation name needed for polling
export async function generateVideo(
  formData: GenerateVideoFormI,
  isGeminiRewrite: boolean,
  appContext: appContextDataI | null
): Promise<GenerateVideoInitiationResult | ErrorResult> {
  // 1 - Authenticate to Google Cloud
  let client
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
    client = await auth.getClient()
  } catch (error) {
    console.error('Authentication Error:', error)
    return { error: 'Unable to authenticate your account to access video generation.' }
  }

  const location = 'us-central1' //TODO update when not in Preview anymore
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const modelVersion = formData.modelVersion || GenerateVideoFormFields.modelVersion.default

  // Construct the API URL for initiating long-running video generation
  const videoAPIUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predictLongRunning`

  // 2 - Build the prompt, potentially rewriting with Gemini
  let fullPrompt: string | ErrorResult
  try {
    fullPrompt = await generatePrompt(formData, isGeminiRewrite)

    if (typeof fullPrompt === 'object' && 'error' in fullPrompt) {
      throw new Error(fullPrompt.error)
    }
  } catch (error) {
    console.error('Prompt Generation Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the prompt.'
    return { error: errorMessage }
  }

  // 3 - Validate App Context and determine GCS URI
  if (!appContext?.gcsURI || !appContext?.userID) {
    console.error('Application context error: Missing GCS URI or User ID.')
    return { error: 'Application context is missing required information (GCS URI or User ID).' }
  }
  const generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-videos`

  // 4 - Build Veo request body parameters based on documentation
  const parameters: Record<string, any> = {
    sampleCount: parseInt(formData.sampleCount, 10),
    aspectRatio: formData.aspectRatio,
    durationSeconds: parseInt(formData.durationSeconds, 10),
    storageUri: generationGcsURI,
    negativePrompt: formData.negativePrompt,
    personGeneration: formData.personGeneration,
  }

  // Full request body
  const reqData: any = {
    instances: [
      {
        prompt: fullPrompt as string,
      },
    ],
    parameters: parameters,
  }

  // 5 - Prepare HTTP request options
  const opts = {
    url: videoAPIUrl,
    method: 'POST',
    data: reqData,
  }

  // 6 - Initiate video generation request
  try {
    const res = await client.request(opts)

    if (res.data && res.data.name) {
      const successResult = { operationName: res.data.name, prompt: fullPrompt as string }
      return successResult
    } else {
      const errorDetail = res.data?.error?.message || 'Unknown error during video generation initiation.'
      const errorResult = { error: `Video initiation failed: ${errorDetail}` }
      return errorResult
    }
  } catch (error: any) {
    console.error('Video Generation Request Error:', error.response?.data || error.message)

    let errorMessage = 'An unexpected error occurred while initiating video generation.'

    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message
    } else if (error.errors && error.errors.length > 0 && error.errors[0].message) {
      errorMessage = error.errors[0].message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    const finalErrorResult = { error: errorMessage }
    return finalErrorResult
  }
}

// Polls the status of a long-running video generation operation.
export async function getVideoGenerationStatus(
  operationName: string,
  appContext: appContextDataI | null,
  formData: GenerateVideoFormI,
  passedPrompt: string
): Promise<VideoGenerationStatusResult> {
  let client
  try {
    const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })
    client = await auth.getClient()
  } catch (error) {
    console.error('Polling Authentication Error:', error)
    return { done: true, error: 'Unable to authenticate for polling status.' }
  }

  // Extract project ID, location, model ID from operationName
  // Example operationName: projects/PROJECT_ID/locations/LOCATION_ID/publishers/google/models/MODEL_ID/operations/OPERATION_ID
  const parts = operationName.split('/')
  if (parts.length < 8) {
    console.error(`Invalid operationName format: ${operationName}`)
    return { done: true, error: 'Invalid operation name format.' }
  }
  const projectId = parts[1]
  const location = parts[3]
  const modelId = parts[7]

  const pollingAPIUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`

  const opts = {
    url: pollingAPIUrl,
    method: 'POST',
    data: {
      operationName: operationName,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  }

  try {
    const res = await client.request(opts)
    const pollingData: PollingResponse = res.data

    if (!pollingData.done) {
      return { done: false, name: operationName }
    } else {
      if (pollingData.error) {
        console.error(`Operation ${operationName} failed:`, pollingData.error)
        return { done: true, error: pollingData.error.message || 'Video generation failed.' }
      } else if (pollingData.response && pollingData.response.videos) {
        const rawVideoResults = pollingData.response.videos.map((video: any) => ({
          gcsUri: video.gcsUri,
          mimeType: video.mimeType,
        }))

        const usedRatio = VideoRatioToPixel.find((item) => item.ratio === formData.aspectRatio)

        const enhancedVideoList = await buildVideoListFromURI({
          videosInGCS: rawVideoResults,
          aspectRatio: formData.aspectRatio,
          duration: parseInt(formData.durationSeconds, 10),
          width: usedRatio?.width ?? 1280,
          height: usedRatio?.height ?? 720,
          usedPrompt: passedPrompt,
          userID: appContext?.userID || '',
          modelVersion: formData.modelVersion,
          mode: 'Generated',
        })
        return { done: true, videos: enhancedVideoList }
      } else {
        console.error(`Operation ${operationName} finished, but response format is unexpected.`, pollingData)
        return { done: true, error: 'Operation finished, but the response was not in the expected format.' }
      }
    }
  } catch (error: any) {
    // Check specifically for 404 error in case the operation truly doesn't exist anymore
    if (error.response?.status === 404) {
      console.error(`Polling Error 404 for ${operationName}: Operation not found at ${pollingAPIUrl}`)
      return { done: true, error: `Operation ${operationName} not found. It might have expired or never existed.` }
    }

    console.error(`Polling Error for ${operationName}:`, error.response?.data || error.message)
    let errorMessage = 'An error occurred while polling the video generation status.'
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    // Treat polling errors as 'done' to prevent infinite loops, but report the error.
    return { done: true, error: errorMessage }
  }
}
