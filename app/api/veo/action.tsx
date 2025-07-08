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

import { decomposeUri, getSignedURL, uploadBase64Image } from '../cloud-storage/action'
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
  cameraPresetsOptions,
} from '../generate-video-utils'
const { GoogleAuth } = require('google-auth-library')

function normalizeSentence(sentence: string) {
  // Split the sentence into individual words
  const words = sentence.toLowerCase().split(' ')

  // Capitalize the first letter of each sentence
  let normalizedSentence = ''
  let newSentence = true
  for (let i = 0; i < words.length; i++) {
    let word = words[i]
    if (newSentence) {
      word = word.charAt(0).toUpperCase() + word.slice(1)
      newSentence = false
    }
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      newSentence = true
    }
    normalizedSentence += word + ' '
  }

  // Replace multiple spaces with single spaces
  normalizedSentence = normalizedSentence.replace(/  +/g, ' ')

  // Remove any trailing punctuation and spaces
  normalizedSentence = normalizedSentence.trim()

  // Remove double commas
  normalizedSentence = normalizedSentence.replace(/, ,/g, ',')

  return normalizedSentence
}

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
}

const customRateLimitMessage = 'Oops, too many incoming access right now, please try again later!'

function isResourceExhaustedError(source: any) {
  if (!source) return false

  let message = ''
  let code = null

  if (typeof source === 'string') {
    message = source.toLowerCase()
    if (message.includes('code: 8') || message.includes('code === 8')) code = 8
  } else if (typeof source === 'object' && source !== null) {
    message = String(source.message || '').toLowerCase()
    code = source.code
  } else return false

  if (
    (code === 8 && message.includes('resource exhausted')) ||
    message.includes("{ code: 8, message: 'resource exhausted.' }") ||
    (message.includes('resource exhausted') &&
      (code === 8 || message.includes('code: 8') || message.includes('code === 8')))
  )
    return true

  return false
}

function generatePrompt(formData: any) {
  let fullPrompt = formData['prompt']

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
      if (typeof signedURLResult === 'object' && signedURLResult['error'])
        throw new Error(
          `Failed to get signed URL for ${videoResult.gcsUri}: ${
            cleanResult ? cleanResult(signedURLResult['error']) : signedURLResult['error']
          }`
        )

      const signedURL = signedURLResult // Assign if successful

      // 8. Construct the final VideoI object with all metadata
      const videoDetails: VideoI = {
        src: signedURL as string,
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

// Initiates Video generation request, returns long-running operation name needed for polling
export async function generateVideo(
  formData: GenerateVideoFormI,
  appContext: appContextDataI | null
): Promise<GenerateVideoInitiationResult | ErrorResult> {
  // 0 - Check requested features
  const hasInterpolImageFirst =
    formData.interpolImageFirst &&
    formData.interpolImageFirst.base64Image !== '' &&
    formData.interpolImageFirst.format !== ''
  const hasInterpolImageLast =
    formData.interpolImageLast &&
    formData.interpolImageLast.base64Image !== '' &&
    formData.interpolImageLast.format !== ''
  const isImageToVideo =
    (hasInterpolImageFirst && !hasInterpolImageLast) || (hasInterpolImageLast && !hasInterpolImageFirst)
  const isInterpolation = hasInterpolImageFirst && hasInterpolImageLast
  const isCameraPreset = formData.cameraPreset !== ''

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

  const location = 'us-central1' //TODO temp - update when not in Preview anymore
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  let modelVersion = formData.modelVersion || GenerateVideoFormFields.modelVersion.default
  if (isInterpolation || isCameraPreset) modelVersion = 'veo-2.0-generate-exp' //TODO temp - update when not in Preview anymore

  // Construct the API URL for initiating long-running video generation
  const videoAPIUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predictLongRunning`

  // 2 - Build the prompt
  let fullPrompt: string | ErrorResult
  if (formData.prompt !== '') fullPrompt = generatePrompt(formData)
  else fullPrompt = ''
  fullPrompt = generatePrompt(formData)

  // 3 - Validate App Context and determine GCS URI
  if (!appContext?.gcsURI || !appContext?.userID) {
    console.error('Application context error: Missing GCS URI or User ID.')
    return { error: 'Application context is missing required information (GCS URI or User ID).' }
  }
  const generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-videos`

  // 4 - Build Veo request body parameters based on documentation
  const parameters = {
    sampleCount: parseInt(formData.sampleCount, 10),
    aspectRatio: formData.aspectRatio,
    durationSeconds: parseInt(formData.durationSeconds, 10),
    storageUri: generationGcsURI,
    negativePrompt: formData.negativePrompt,
    personGeneration: formData.personGeneration,
    generateAudio: formData.modelVersion.includes('veo-3.0') && formData.isVideoWithAudio,
  }

  const reqData: any = {
    instances: [
      {
        prompt: fullPrompt as string,
      },
    ],
    parameters: parameters,
  }

  if (formData.cameraPreset)
    reqData.instances[0].cameraControl = cameraPresetsOptions.find(
      (item) => item.label === formData.cameraPreset
    )?.value

  // 5 - Handle Image-to-video & interpolation
  // 5.1 - Simple ITV use case, either first or last frame provided, API requires the base64
  if (isImageToVideo) {
    if (hasInterpolImageFirst) {
      const interpolImageFirst = formData.interpolImageFirst.base64Image.startsWith('data:')
        ? formData.interpolImageFirst.base64Image.split(',')[1]
        : formData.interpolImageFirst.base64Image
      reqData.instances[0].image = {
        bytesBase64Encoded: interpolImageFirst,
        mimeType: formData.interpolImageFirst.format,
      }
    } else {
      const interpolImageLast = formData.interpolImageLast.base64Image.startsWith('data:')
        ? formData.interpolImageLast.base64Image.split(',')[1]
        : formData.interpolImageLast.base64Image
      reqData.instances[0].lastFrame = {
        bytesBase64Encoded: interpolImageLast,
        mimeType: formData.interpolImageLast.format,
      }
    }
  }

  // 5.2 - Interpolation use case, API requires the GCS URIs of the images
  if (isInterpolation) {
    try {
      // Store base64 image in GCS first
      const generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-videos/interpolation-frames`
      const bucketName = generationGcsURI.replace('gs://', '').split('/')[0]
      const folderName = generationGcsURI.split(bucketName + '/')[1]

      // Handle first frame for interpolation
      let interpolImageFirstUri = ''
      const objectNameFirst = `${folderName}/${Math.random().toString(36).substring(2, 15)}.${
        formData.interpolImageFirst.format.split('/')[1]
      }`
      await uploadBase64Image(formData.interpolImageFirst.base64Image.split(',')[1], bucketName, objectNameFirst).then(
        (result) => {
          if (!result.success) throw Error(cleanResult(result.error ?? 'Could not upload image to GCS'))
          interpolImageFirstUri = result.fileUrl ?? ''
        }
      )
      reqData.instances[0].image = {
        gcsUri: interpolImageFirstUri,
        mimeType: formData.interpolImageFirst.format,
      }

      // Handle Last frame for interpolation
      let interpolImageLastUri = ''
      const objectNameLast = `${folderName}/${Math.random().toString(36).substring(2, 15)}.${
        formData.interpolImageLast.format.split('/')[1]
      }`
      await uploadBase64Image(formData.interpolImageLast.base64Image.split(',')[1], bucketName, objectNameLast).then(
        (result) => {
          if (!result.success) throw Error(cleanResult(result.error ?? 'Could not upload image to GCS'))
          interpolImageLastUri = result.fileUrl ?? ''
        }
      )
      reqData.instances[0].lastFrame = {
        gcsUri: interpolImageLastUri,
        mimeType: formData.interpolImageLast.format,
      }
    } catch (error) {
      console.error(error)
      return {
        error: 'Error while getting secured access to content.',
      }
    }
  }

  // 6 - Prepare HTTP request options
  const opts = {
    url: videoAPIUrl,
    method: 'POST',
    data: reqData,
  }

  // 7 - Initiate video generation request
  try {
    const res = await client.request(opts)

    // a. Handle successful response
    if (res.data?.name) return { operationName: res.data.name, prompt: fullPrompt as string }

    // b. Handle API-returned error (non-exception, structured error in response body)
    const apiError = res.data?.error
    if (apiError) {
      if (isResourceExhaustedError(apiError)) return { error: customRateLimitMessage }

      // For other API errors not caught by isResourceExhaustedError
      const errorDetail = apiError.message || 'Unknown error during video generation initiation.'
      return { error: `Video initiation failed: ${errorDetail}` }
    }

    // c. Fallback for other unexpected response structures from the API call (not an exception)
    return { error: 'Video initiation failed: Unknown error structure in response data.' }
  } catch (error: any) {
    // Log the raw error for debugging
    console.error('Video Generation Request Error:', error.response?.data || error.message || error)
    const nestedError = error.response?.data?.error

    // Handle specific HTTP status codes that often mean rate limiting or server overload
    if (
      error.response?.status === 429 ||
      error.response?.status === 503 ||
      isResourceExhaustedError(error) ||
      isResourceExhaustedError(nestedError) ||
      isResourceExhaustedError(error.response?.data) ||
      (error.errors &&
        Array.isArray(error.errors) &&
        error.errors.length > 0 &&
        isResourceExhaustedError(error.errors[0]))
    )
      return { error: customRateLimitMessage }

    // Handle HTTP 400 (Bad Request) specifically, if not a resource exhaustion error
    if (error.response?.status === 400)
      return { error: 'Bad request: There was an issue with the request parameters for video generation.' }

    // Generic error message if none of the above specific conditions were met
    return { error: 'An unexpected error occurred while initiating video generation.' }
  }
}

// Polls the status of a long-running video generation operation.
export async function getVideoGenerationStatus(
  operationName: string,
  appContext: appContextDataI | null,
  formData: GenerateVideoFormI,
  passedPrompt: string
): Promise<VideoGenerationStatusResult> {
  // 1 - Authenticate to Google Cloud
  let client
  try {
    const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })
    client = await auth.getClient()
  } catch (error) {
    console.error('Polling Authentication Error:', error)
    return { done: true, error: 'Unable to authenticate for polling status.' }
  }

  // 2 - Build polling request
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

  // 3 - Poll for status of video generation operation
  try {
    const res = await client.request(opts)

    const pollingData: PollingResponse = res.data // Assuming PollingResponse matches LRO Get response

    if (!pollingData.done) return { done: false, name: operationName }
    else {
      if (pollingData.error) {
        console.error(`Operation ${operationName} failed:`, pollingData.error)
        if (
          pollingData.error.code === 8 &&
          typeof pollingData.error.message === 'string' &&
          pollingData.error.message.toLowerCase().includes('resource exhausted')
        )
          return { done: true, error: customRateLimitMessage }

        if (
          typeof pollingData.error.message === 'string' &&
          pollingData.error.message.includes("{ code: 8, message: 'Resource exhausted.' }")
        )
          return { done: true, error: customRateLimitMessage }

        return { done: true, error: pollingData.error.message || 'Video generation failed.' }
      } else if (pollingData.response && pollingData.response.videos) {
        // TODO remove
        console.log('Polling Response:', pollingData.response)

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
    if (error.response?.status === 404) {
      console.error(`Polling Error 404 for ${operationName}: Operation not found at ${pollingAPIUrl}`)
      return { done: true, error: `Operation ${operationName} not found. It might have expired or never existed.` }
    }
    if (error.response?.status === 429 || error.response?.status === 503)
      return { done: true, error: customRateLimitMessage }

    console.error(`Polling Error for ${operationName}:`, error.response?.data || error.message)
    let errorMessage = 'An error occurred while polling the video generation status.'
    const nestedError = error.response?.data?.error
    if (nestedError) {
      if (
        nestedError.code === 8 &&
        typeof nestedError.message === 'string' &&
        nestedError.message.toLowerCase().includes('resource exhausted')
      )
        return { done: true, error: customRateLimitMessage }

      if (
        typeof nestedError.message === 'string' &&
        nestedError.message.includes("{ code: 8, message: 'Resource exhausted.' }")
      )
        return { done: true, error: customRateLimitMessage }

      if (nestedError.message) errorMessage = nestedError.message
    } else if (error instanceof Error && error.message) {
      // Check error.message directly
      errorMessage = error.message
      // More robust check for resource exhausted in generic error message
      if (errorMessage.toLowerCase().includes('resource exhausted') && errorMessage.includes('code: 8')) {
        return { done: true, error: customRateLimitMessage }
      }
    }
    return { done: true, error: errorMessage }
  }
}
