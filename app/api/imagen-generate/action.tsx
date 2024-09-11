'use server'

import {
  fullPromptAdditionalFields,
  GenerateImageFormI,
  GeneratedImagesInGCSI,
  ImageI,
  RatioToPixel,
} from './generate-utils'
import { getSignedURL } from '../cloud-storage/action'
import { rewriteWithGemini } from '../gemini/action'
import { appContextDataI } from '../../context/app-context'
const { GoogleAuth } = require('google-auth-library')

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
}

async function generatePrompt(formData: GenerateImageFormI, isGeminiRewrite: boolean) {
  let fullPrompt = `Capture ${formData['prompt']}.`
  let parameters = ''

  fullPromptAdditionalFields.forEach((additionalField) => {
    if (formData[additionalField] !== '') {
      parameters += ` With ${additionalField.replaceAll('_', ' ')} being ${formData[additionalField]}.`
    }
  })

  if (parameters !== '') {
    fullPrompt = `${fullPrompt} Make sure you use following parameters: ${parameters}`
  }

  if (isGeminiRewrite) {
    try {
      const geminiReturnedPrompt = await rewriteWithGemini(fullPrompt)

      if (typeof geminiReturnedPrompt === 'object' && 'error' in geminiReturnedPrompt) {
        const errorMsg = cleanResult(JSON.stringify(geminiReturnedPrompt['error']).replaceAll('Error: ', ''))
        throw Error(errorMsg)
      } else {
        fullPrompt = geminiReturnedPrompt as string
      }
    } catch (error) {
      console.error(error)
      return { error: 'Error while rewriting prompt with Gemini .' }
    }
  }

  fullPrompt = `With output image style being ${formData['style']}.` + fullPrompt

  return fullPrompt
}

export async function buildImageList({
  generatedImagesInGCS,
  aspectRatio,
  usedPrompt,
  userID,
}: {
  generatedImagesInGCS: GeneratedImagesInGCSI[]
  aspectRatio: string
  usedPrompt: string
  userID: string
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
          throw Error(cleanResult(signedURL.error))
        } else {
          return {
            src: signedURL,
            gcsUri: image.gcsUri,
            format: image.mimeType.replace('image/', ' ').toUpperCase(),
            prompt: usedPrompt,
            altText: `Generated image ${fileName}`,
            key: fileName,
            width: usedWidth,
            height: useHeight,
            ratio: aspectRatio,
            date: new Date(Date.now()).toLocaleString().split(',')[0],
            author: userID, //#TODO get auth user name from IAP
          }
        }
      } catch (error) {
        console.error(error)
        return {
          error: 'Error while getting secured access to content.',
        }
      }
    }
  })

  const generatedImagesToDisplay = (await Promise.all(promises)).filter(
    (image) => image !== null
  ) as unknown as ImageI[]

  return generatedImagesToDisplay
}

export async function generateImage(
  formData: GenerateImageFormI,
  isGeminiRewrite: boolean,
  appContext: appContextDataI | null
) {
  // 1 - Atempting to authent to Google Cloud & fetch project informations
  let client
  let projectId
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
    client = await auth.getClient()
    projectId = await auth.getProjectId()
  } catch (error) {
    console.error(error)
    return {
      error: 'Unable to authenticate your account to access images',
    }
  }
  const location = process.env.VERTEX_API_LOCATION
  const modelVestion = formData['modelVersion']
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVestion}:predict`

  // 2 - Building the prompt and rewrite it if needed with Gemini
  let fullPrompt
  try {
    fullPrompt = await generatePrompt(formData, isGeminiRewrite)

    if (typeof fullPrompt === 'object' && 'error' in fullPrompt) {
      throw Error(fullPrompt.error)
    }
  } catch (error) {
    console.error(error)
    return {
      error: 'An error occurred while generating the prompt.',
    }
  }

  // 3 - Building Imagen request body
  const reqData = {
    instances: [
      {
        prompt: fullPrompt as string,
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
      storageUri: appContext?.generationImageUri,
    },
  }
  const opts = {
    url: imagenAPIurl,
    method: 'POST',
    data: reqData,
  }

  // 4 - Generating images
  try {
    console.log('Generating image(s) using parameters > ' + JSON.stringify(reqData, undefined, 4))

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
      usedPrompt: opts.data.instances[0].prompt,
      userID: appContext?.userID ? appContext?.userID : '',
    })

    return enhancedImageList
  } catch (error) {
    //#TODO clean error handling
    /*var newError = error as any

    if (Object.keys(newError).length !== 0 && 'error' in newError.response.data) {
      const errorObject = newError.response.data.error

      if (errorObject == 'invalid_grant') newError = 'Unable to authenticate your account to access images'
      else {
        newError = errorObject.message
        errorObject.code == 404 && (newError = '404 - A ressource were not found.')
      }
    } else {
      newError = newError.toString()
    }*/

    console.error(error)
    return {
      error: 'Error while generating images.',
    }
  }
}
