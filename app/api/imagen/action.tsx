'use server'

import {
  fullPromptAdditionalFields,
  GenerateImageFormI,
  VisionGenerativeModelResultI,
  ImageI,
  RatioToPixel,
} from '../generate-utils'
import { decomposeUri, getSignedURL } from '../cloud-storage/action'
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
  imagesInGCS,
  aspectRatio,
  usedPrompt,
  userID,
  modelVersion,
}: {
  imagesInGCS: VisionGenerativeModelResultI[]
  aspectRatio: string
  usedPrompt: string
  userID: string
  modelVersion: string
}) {
  const promises = imagesInGCS.map(async (image) => {
    if ('raiFilteredReason' in image) {
      return {
        warning: `${image['raiFilteredReason']}`,
      }
    } else {
      const { fileName } = await decomposeUri(image.gcsUri)

      const usedRatio = RatioToPixel.find((item) => item.ratio === aspectRatio)
      const usedWidth = usedRatio?.width
      const useHeight = usedRatio?.height

      const format = image.mimeType.replace('image/', '').toUpperCase()

      const ID = fileName
        .replaceAll('/', '')
        .replace(userID, '')
        .replace('generated-images', '')
        .replace('sample_', '')
        .replace(`.${format.toLowerCase()}`, '')

      const today = new Date()
      const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

      // Get signed URL from Cloud Storage API
      try {
        const signedURL: string | { error: string } = await getSignedURL(image.gcsUri)

        if (typeof signedURL === 'object' && 'error' in signedURL) {
          throw Error(cleanResult(signedURL.error))
        } else {
          return {
            src: signedURL,
            gcsUri: image.gcsUri,
            format: format,
            prompt: usedPrompt,
            altText: `Generated image ${fileName}`,
            key: ID,
            width: usedWidth,
            height: useHeight,
            ratio: aspectRatio,
            date: formattedDate,
            author: userID,
            modelVersion: modelVersion,
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
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
    client = await auth.getClient()
  } catch (error) {
    console.error(error)
    return {
      error: 'Unable to authenticate your account to access images',
    }
  }
  const location = process.env.VERTEX_API_LOCATION
  const projectId = process.env.PROJECT_ID
  const modelVersion = formData['modelVersion']
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`

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

  if (appContext === undefined) throw Error('No provided app context')

  // 3 - Building Imagen request body
  let generationGcsURI = ''
  if (
    appContext === undefined ||
    appContext === null ||
    appContext.gcsURI === undefined ||
    appContext.userID === undefined
  )
    throw Error('No provided app context')
  else {
    generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-images`
  }
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
      storageUri: generationGcsURI,
    },
  }
  const opts = {
    url: imagenAPIurl,
    method: 'POST',
    data: reqData,
  }

  // 4 - Generating images
  try {
    const res = await client.request(opts)

    if (res.data.predictions === undefined) {
      throw Error('There were an issue, no images were generated')
    }
    // NO images at all were generated out of all samples
    if ('raiFilteredReason' in res.data.predictions[0]) {
      throw Error(cleanResult(res.data.predictions[0].raiFilteredReason))
    }

    console.log('Image generated with success')

    const imagesInGCS: VisionGenerativeModelResultI[] = res.data.predictions
    const enhancedImageList = await buildImageList({
      imagesInGCS: imagesInGCS,
      aspectRatio: opts.data.parameters.aspectRatio,
      usedPrompt: opts.data.instances[0].prompt,
      userID: appContext?.userID ? appContext?.userID : '',
      modelVersion: modelVersion,
    })

    return enhancedImageList
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while generating images.',
    }
  }
}

export async function upscaleImage(modelVersion: string, sourceUri: string, upscaleFactor: string) {
  // 1 - Atempting to authent to Google Cloud & fetch project informations
  let client
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
    client = await auth.getClient()
  } catch (error) {
    console.error(error)
    return {
      error: 'Unable to authenticate your account to access images',
    }
  }
  const location = process.env.VERTEX_API_LOCATION
  const projectId = process.env.PROJECT_ID
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`

  const reqData = {
    instances: [
      {
        prompt: '',
        image: {
          gcsUri: sourceUri,
        },
      },
    ],
    parameters: {
      sampleCount: 1,
      mode: 'upscale',
      upscaleConfig: {
        upscaleFactor: upscaleFactor,
      },
    },
  }
  const opts = {
    url: imagenAPIurl,
    method: 'POST',
    data: reqData,
  }

  console.log('XXXX opts : ', JSON.stringify(opts, undefined, 4)) //TODO out

  // 2 - Upscaling images
  try {
    const timeout = 20000 // ms, 20s

    const res = await Promise.race([
      client.request(opts),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Upscaling timed out')), timeout)),
    ])
    console.log('XXXX opts : ', JSON.stringify(res, undefined, 4)) //TODO out

    if (res.data.predictions === undefined) {
      throw Error('There were an issue, images could not be upscaled')
    }

    const newGcsUri: string = res.data.predictions[0].gcsUri

    return newGcsUri
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while upscaling images.',
    }
  }
}
