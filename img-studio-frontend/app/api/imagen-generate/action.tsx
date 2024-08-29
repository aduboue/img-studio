'use server'

import {
  fullPromptAdditionalFields,
  formDataI,
  GeneratedImagesInGCSI,
  ImageI,
  RatioToPixel,
} from './generate-definitions'
import { getSignedURL } from '../cloud-storage/action'
import { rewriteWithGemini } from '../gemini/action'
const { GoogleAuth } = require('google-auth-library')

export async function buildImageList({
  generatedImagesInGCS,
  aspectRatio,
}: {
  generatedImagesInGCS: GeneratedImagesInGCSI[]
  aspectRatio: string
}) {
  const promises = generatedImagesInGCS.map(async (image) => {
    if ('raiFilteredReason' in image) {
      return {
        warning: `${image['raiFilteredReason']}`,
      }
    } else {
      const path = image.gcsUri.replace('gs://', '')
      const parts = path.split('/')
      const bucketName = parts[0]
      const fileName = parts.slice(1).join('/') // Handle filenames with '/' in them

      const usedRatio = RatioToPixel.find((item) => item.ratio === aspectRatio)
      const usedWidth = usedRatio?.width
      const useHeight = usedRatio?.height

      // Get signed URL from Cloud Storage API
      const signedURL: string | { error: string } = await getSignedURL(bucketName, fileName)

      if (typeof signedURL === 'object' && 'error' in signedURL) {
        throw signedURL.error
      } else {
        return {
          src: signedURL,
          gcsUri: image.gcsUri,
          type: image.mimeType,
          altText: `Generated image ${fileName}`,
          key: `${fileName}`,
          width: `${usedWidth}`,
          height: `${useHeight}`,
          ratio: `${usedRatio}`,
        }
      }
    }
  })

  const generatedImagesToDisplay = (await Promise.all(promises)).filter(
    (image) => image !== null
  ) as unknown as ImageI[]

  return generatedImagesToDisplay
}

export async function generateImage(formData: formDataI, isGeminiRewrite: boolean) {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  })
  const client = await auth.getClient()
  const projectId = await auth.getProjectId()
  const location = process.env.VERTEX_API_LOCATION
  const modelVestion = formData['modelVersion']
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVestion}:predict`

  var fullPrompt = 'capture ' + formData['prompt']
  fullPromptAdditionalFields.forEach(
    (additionalField) =>
      (fullPrompt =
        formData[additionalField] !== ''
          ? fullPrompt + ', with ' + additionalField.replaceAll('_', ' ') + ' ' + formData[additionalField]
          : fullPrompt)
  )

  if (isGeminiRewrite) {
    fullPrompt = await rewriteWithGemini(fullPrompt)
    fullPrompt = fullPrompt.replaceAll('*', '')
  }

  const data = {
    instances: [
      {
        prompt: fullPrompt,
      },
    ],
    parameters: {
      sampleCount: parseInt(formData['sampleCount']),
      negativePrompt: formData['negativePrompt'],
      aspectRatio: formData['aspectRatio'],
      outputOptions: {
        mimeType: formData['outputOptions'],
      },
      includeRaiReason: true,
      personGeneration: formData['personGeneration'],
      storageUri: process.env.GENERATED_IMAGE_BUCKET, //TODO later, test if exist, if not create it + add specific folder name
    },
  }

  const opts = {
    url: imagenAPIurl,
    method: 'POST',
    data: data,
  }

  try {
    console.log('Using params = ' + JSON.stringify(data))

    const res = await client.request(opts)

    if (res.data.predictions === undefined) {
      throw Error('There were an issue, no images were generated')
    }

    // NO images at all were generated out of all samples
    if ('raiFilteredReason' in res.data.predictions[0]) {
      throw Error(res.data.predictions[0].raiFilteredReason)
    }

    const imgGCSlist: GeneratedImagesInGCSI[] = res.data.predictions
    const enhancedImageList = await buildImageList({
      generatedImagesInGCS: imgGCSlist,
      aspectRatio: data.parameters.aspectRatio,
    })

    return enhancedImageList
  } catch (error) {
    return {
      error: `${error}`,
    }
  }
}
