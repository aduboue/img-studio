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

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
}

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
      try {
        const signedURL: string | { error: string } = await getSignedURL(bucketName, fileName)
        if (typeof signedURL === 'object' && 'error' in signedURL) {
          const errorMsg = cleanResult(signedURL.error)
          if (errorMsg.includes('unable to impersonate'))
            throw Error('Unable to authenticate your account to access images')

          throw Error(errorMsg)
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
      } catch (error) {
        return {
          error: `${error}`,
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
  // Atempting to authent to Google Cloud
  var client
  var projectId
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
    client = await auth.getClient()
    projectId = await auth.getProjectId()
  } catch (error) {
    return {
      error: `${error}`,
    }
  }

  const location = process.env.VERTEX_API_LOCATION
  const modelVestion = formData['modelVersion']
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVestion}:predict`

  var fullPrompt = `Capture ${formData['prompt']}.`
  fullPromptAdditionalFields.forEach(
    (additionalField) =>
      (fullPrompt =
        formData[additionalField] !== ''
          ? `${fullPrompt} With ${additionalField.replaceAll('_', ' ')} being ${formData[additionalField]}.`
          : fullPrompt)
  )

  // If asked, rewriting the prompt with Gemini
  try {
    if (isGeminiRewrite) {
      const geminiReturnedPrompt = await rewriteWithGemini(fullPrompt)

      if (typeof geminiReturnedPrompt === 'object' && 'error' in geminiReturnedPrompt) {
        const errorMsg = cleanResult(JSON.stringify(geminiReturnedPrompt['error']).replaceAll('Error: ', ''))
        throw Error(errorMsg)
      } else {
        fullPrompt = geminiReturnedPrompt
        console.log('Prompt successfuly rewritten with Gemini')
      }
    }
  } catch (error) {
    return {
      error: `${error}`,
    }
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

  // Generation of the images
  try {
    console.log('Generating image(s) using parameters > ' + JSON.stringify(data, undefined, 4))

    const res = await client.request(opts)

    if (res.data.predictions === undefined) {
      throw Error('There were an issue, no images were generated')
    }

    // NO images at all were generated out of all samples
    if ('raiFilteredReason' in res.data.predictions[0]) {
      throw Error(cleanResult(res.data.predictions[0].raiFilteredReason))
    }

    console.log('Image generated with success')

    const imgGCSlist: GeneratedImagesInGCSI[] = res.data.predictions
    const enhancedImageList = await buildImageList({
      generatedImagesInGCS: imgGCSlist,
      aspectRatio: opts.data.parameters.aspectRatio,
    })

    return enhancedImageList
  } catch (error) {
    var newError = error as any
    console.log('XXX REP ' + JSON.stringify(error, undefined, 4))

    if (typeof newError === 'object' && 'error' in newError.response.data) {
      if (newError.response.data.error.includes('invalid_grant'))
        newError = 'Unable to authenticate your account to access images'
      else {
        newError = newError.response.data.error_description
      }
    }
    return {
      error: `${newError}`,
    }
  }
}
