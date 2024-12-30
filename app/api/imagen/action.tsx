'use server'

import {
  fullPromptAdditionalFields,
  GenerateImageFormI,
  VisionGenerativeModelResultI,
  ImageI,
  RatioToPixel,
  referenceTypeMatching,
  ReferenceObjectI,
} from '../generate-utils'
import { decomposeUri, downloadImage, getSignedURL } from '../cloud-storage/action'
import { rewriteWithGemini, truncateLog } from '../gemini/action'
import { appContextDataI } from '../../context/app-context'
import { EditImageFormI } from '../edit-utils'
const { GoogleAuth } = require('google-auth-library')

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
}

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

async function generatePrompt(formData: GenerateImageFormI, isGeminiRewrite: boolean, references: ReferenceObjectI[]) {
  let fullPrompt = formData['prompt']

  // Rewrite the content of the prompt
  if (isGeminiRewrite) {
    try {
      const geminiReturnedPrompt = await rewriteWithGemini(fullPrompt)

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
  fullPromptAdditionalFields.forEach((additionalField) => {
    if (formData[additionalField] !== '')
      parameters += ` ${formData[additionalField]} ${additionalField.replaceAll('_', ' ')}, `
  })
  if (parameters !== '') fullPrompt = `${fullPrompt}, ${parameters}`

  // Add quality modifiers to the prompt
  let quality_modifiers = ', high-quality, beautiful, stylized'
  if (formData['style'] === 'photo') {
    quality_modifiers = quality_modifiers + ', 4K'
  } else quality_modifiers = quality_modifiers + ', by a professional, detailed'

  if (formData['use_case'] === 'Food, insects, plants (still life)')
    quality_modifiers = quality_modifiers + ', High detail, precise focusing, controlled lighting'

  if (formData['use_case'] === 'Sports, wildlife (motion)')
    quality_modifiers = quality_modifiers + ', Fast shutter speed, movement tracking'

  if (formData['use_case'] === 'Astronomical, landscape (wide-angle)')
    quality_modifiers = quality_modifiers + ', Long exposure times, sharp focus, long exposure, smooth water or clouds'

  fullPrompt = fullPrompt + quality_modifiers

  // Add references to the prompt
  if (references.length > 0) {
    let reference = 'Generate an image '
    let subjects: string[] = []
    let subjectsID: number[] = []
    let styles: string[] = []
    let stylesID: number[] = []

    for (const [index, reference] of references.entries()) {
      const params = referenceTypeMatching[reference.referenceType as keyof typeof referenceTypeMatching]

      if (params.referenceType === 'REFERENCE_TYPE_SUBJECT')
        if (!subjectsID.includes(reference.refId)) {
          subjects.push(`a ${reference.description.toLowerCase()} [${reference.refId}]`)
          subjectsID.push(reference.refId)
        }

      if (params.referenceType === 'REFERENCE_TYPE_STYLE')
        if (!stylesID.includes(reference.refId)) {
          styles.push(`in a ${reference.description.toLowerCase()} style [${reference.refId}]`)
          stylesID.push(reference.refId)
        }
    }

    if (subjects.length > 0) reference = reference + 'about ' + subjects.join(', ')
    if (styles.length > 0) reference = reference.trim() + ', ' + styles.join(', ')
    reference = reference + ' to match the description: '

    fullPrompt = reference + fullPrompt
  }

  fullPrompt = normalizeSentence(fullPrompt)

  return fullPrompt
}

export async function buildImageList({
  imagesInGCS,
  aspectRatio,
  width,
  height,
  usedPrompt,
  userID,
  modelVersion,
  mode,
}: {
  imagesInGCS: VisionGenerativeModelResultI[]
  aspectRatio: string
  width: number
  height: number
  usedPrompt: string
  userID: string
  modelVersion: string
  mode: string
}) {
  const promises = imagesInGCS.map(async (image) => {
    if ('raiFilteredReason' in image) {
      return {
        warning: `${image['raiFilteredReason']}`,
      }
    } else {
      const { fileName } = await decomposeUri(image.gcsUri)

      const format = image.mimeType.replace('image/', '').toUpperCase()

      const ID = fileName
        .replaceAll('/', '')
        .replace(userID, '')
        .replace('generated-images', '')
        .replace('edited-images', '')
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
            width: width,
            height: height,
            ratio: aspectRatio,
            date: formattedDate,
            author: userID,
            modelVersion: modelVersion,
            mode: mode,
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

  let references = formData['referenceObjects']
  const hasValidReference = references.some(
    (reference) =>
      reference.base64Image !== '' &&
      reference.description !== '' &&
      reference.refId !== null &&
      reference.referenceType !== ''
  )
  if (!hasValidReference) references = []
  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const modelVersion = formData['modelVersion']
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`

  // 2 - Building the prompt and rewrite it if needed with Gemini
  let fullPrompt
  try {
    fullPrompt = await generatePrompt(formData, isGeminiRewrite, references)

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
  let reqData: any = {
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

  // Adding references if necessary
  if (hasValidReference) {
    reqData.parameters.editMode = 'EDIT_MODE_DEFAULT'

    reqData.instances[0].referenceImages = []

    for (const [index, reference] of references.entries()) {
      const params = referenceTypeMatching[reference.referenceType as keyof typeof referenceTypeMatching]

      let newReference: any = {
        referenceType: params.referenceType,
        referenceId: reference.refId,
        referenceImage: {
          bytesBase64Encoded: reference.base64Image.startsWith('data:')
            ? reference.base64Image.split(',')[1]
            : reference.base64Image,
        },
      }

      if (params.referenceType === 'REFERENCE_TYPE_SUBJECT')
        newReference = {
          ...newReference,
          subjectImageConfig: {
            subjectDescription: reference.description,
            subjectType: params.subjectType,
          },
        }

      if (params.referenceType === 'REFERENCE_TYPE_STYLE')
        newReference = {
          ...newReference,
          styleImageConfig: {
            styleDescription: reference.description,
          },
        }

      reqData.instances[0].referenceImages[index] = newReference
    }
  }
  const opts = {
    url: imagenAPIurl,
    method: 'POST',
    data: reqData,
  }

  // 4 - Generating images
  try {
    const res = await client.request(opts)

    if (res.data.predictions === undefined) throw Error('There were an issue, no images were generated')

    // NO images at all were generated out of all samples
    if ('raiFilteredReason' in res.data.predictions[0])
      throw Error(cleanResult(res.data.predictions[0].raiFilteredReason))

    console.log('Image generated with success')

    const usedRatio = RatioToPixel.find((item) => item.ratio === opts.data.parameters.aspectRatio)

    const imagesInGCS: VisionGenerativeModelResultI[] = res.data.predictions
    const enhancedImageList = await buildImageList({
      imagesInGCS: imagesInGCS,
      aspectRatio: opts.data.parameters.aspectRatio,
      width: usedRatio?.width ?? 0,
      height: usedRatio?.height ?? 0,
      usedPrompt: opts.data.instances[0].prompt,
      userID: appContext?.userID ? appContext?.userID : '',
      modelVersion: modelVersion,
      mode: 'Generated',
    })

    return enhancedImageList
  } catch (error) {
    console.error(error)

    const errorString = error instanceof Error ? error.toString() : ''
    if (
      errorString.includes('safety settings for peopleface generation') ||
      errorString.includes("All images were filtered out because they violated Vertex AI's usage guidelines")
    ) {
      return {
        error: errorString.replace('Error: ', ''),
      }
    }

    const myError = error as Error & { errors: any[] }
    const myErrorMsg = myError.errors[0].message.replace('Image generation failed with the following error: ', '')

    return {
      error: myErrorMsg,
    }
  }
}

export async function editImage(formData: EditImageFormI, appContext: appContextDataI | null) {
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

  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const modelVersion = formData['modelVersion']
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`

  if (appContext === undefined) throw Error('No provided app context')

  // 2 - Building Imagen request body
  let editGcsURI = ''
  if (
    appContext === undefined ||
    appContext === null ||
    appContext.gcsURI === undefined ||
    appContext.userID === undefined
  )
    throw Error('No provided app context')
  else {
    editGcsURI = `${appContext.gcsURI}/${appContext.userID}/edited-images`
  }

  const refInputImage = formData['inputImage'].startsWith('data:')
    ? formData['inputImage'].split(',')[1]
    : formData['inputImage']
  const refInputMask = formData['inputMask'].startsWith('data:')
    ? formData['inputMask'].split(',')[1]
    : formData['inputMask']

  const editMode = formData['editMode']

  const reqData = {
    instances: [
      {
        prompt: formData.prompt as string,
        referenceImages: [
          {
            referenceType: 'REFERENCE_TYPE_RAW',
            referenceId: 1,
            referenceImage: {
              bytesBase64Encoded: refInputImage,
            },
          },
          {
            referenceType: 'REFERENCE_TYPE_MASK',
            referenceId: 2,
            referenceImage: {
              bytesBase64Encoded: refInputMask,
            },
            maskImageConfig: {
              maskMode: 'MASK_MODE_USER_PROVIDED',
              dilation: parseFloat(formData['maskDilation']),
            },
          },
        ],
      },
    ],
    parameters: {
      negativePrompt: formData['negativePrompt'],
      promptLanguage: 'en',
      seed: 1,
      editConfig: {
        baseSteps: parseInt(formData['baseSteps']),
      },
      editMode: editMode,
      sampleCount: parseInt(formData['sampleCount']),
      outputOptions: {
        mimeType: formData['outputOptions'],
      },
      includeRaiReason: true,
      personGeneration: formData['personGeneration'],
      storageUri: editGcsURI,
    },
  }

  if (editMode === 'EDIT_MODE_BGSWAP') {
    const referenceImage = reqData.instances[0].referenceImages[1] as any

    delete referenceImage.referenceImage
    referenceImage.maskImageConfig.maskMode = 'MASK_MODE_BACKGROUND'
    delete referenceImage.maskImageConfig.dilation
  }

  const opts = {
    url: imagenAPIurl,
    method: 'POST',
    data: reqData,
  }

  // 3 - Editing image
  let res
  try {
    res = await client.request(opts)

    if (res.data.predictions === undefined) {
      throw Error('There were an issue, no images were generated')
    }
    // NO images at all were generated out of all samples
    if ('raiFilteredReason' in res.data.predictions[0]) {
      throw Error(cleanResult(res.data.predictions[0].raiFilteredReason))
    }

    console.log('Image generated with success')
  } catch (error) {
    console.error(error)

    const errorString = error instanceof Error ? error.toString() : ''
    if (
      errorString.includes('safety settings for peopleface generation') ||
      errorString.includes("All images were filtered out because they violated Vertex AI's usage guidelines")
    ) {
      return {
        error: errorString.replace('Error: ', ''),
      }
    }

    const myError = error as Error & { errors: any[] }
    const myErrorMsg = myError.errors[0].message

    return {
      error: myErrorMsg,
    }
  }

  // 4 - Creating output image list
  try {
    const imagesInGCS: VisionGenerativeModelResultI[] = res.data.predictions
    const enhancedImageList = await buildImageList({
      imagesInGCS: imagesInGCS,
      aspectRatio: formData['ratio'],
      width: formData['width'],
      height: formData['height'],
      usedPrompt: opts.data.instances[0].prompt,
      userID: appContext?.userID ? appContext?.userID : '',
      modelVersion: modelVersion,
      mode: 'Edited',
    })

    return enhancedImageList
  } catch (error) {
    console.error(error)
    return {
      error: 'Issue while editing image.',
    }
  }
}

export async function upscaleImage(sourceUri: string, upscaleFactor: string, appContext: appContextDataI | null) {
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
  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@002:predict`

  // 2 Downloading source image
  let res
  try {
    res = await downloadImage(sourceUri)

    if (typeof res === 'object' && res['error']) {
      throw Error(res['error'].replaceAll('Error: ', ''))
    }
  } catch (error: any) {
    throw Error(error)
  }
  const { image } = res

  // 3 - Building Imagen request body
  let targetGCSuri = ''
  if (
    appContext === undefined ||
    appContext === null ||
    appContext.gcsURI === undefined ||
    appContext.userID === undefined
  )
    throw Error('No provided app context')
  else {
    targetGCSuri = `${appContext.gcsURI}/${appContext.userID}/upscaled-images`
  }
  const reqData = {
    instances: [
      {
        prompt: '',
        image: {
          bytesBase64Encoded: image,
        },
      },
    ],
    parameters: {
      sampleCount: 1,
      mode: 'upscale',
      upscaleConfig: {
        upscaleFactor: upscaleFactor,
      },
      storageUri: targetGCSuri,
    },
  }
  const opts = {
    url: imagenAPIurl,
    method: 'POST',
    data: reqData,
  }

  // 4 - Upscaling images
  try {
    const timeout = 60000 // ms, 20s

    const res = await Promise.race([
      client.request(opts),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Upscaling timed out')), timeout)),
    ])
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
