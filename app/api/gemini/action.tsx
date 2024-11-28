'use server'

import { processImageBase64 } from '../vertex-seg/action'

const { VertexAI } = require('@google-cloud/vertexai')

// Truncate logs to be readable
export async function truncateLog(obj: any, maxLength = 300) {
  const truncatedObj = JSON.parse(JSON.stringify(obj))

  for (const key in truncatedObj) {
    if (typeof truncatedObj[key] === 'string' && truncatedObj[key].length > maxLength) {
      truncatedObj[key] = truncatedObj[key].slice(0, maxLength) + '...'
    } else if (typeof truncatedObj[key] === 'object') {
      truncatedObj[key] = truncateLog(truncatedObj[key], maxLength)
    }
  }

  return truncatedObj
}

export async function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '').replaceAll('.', '')
}

function getFormatFromBase64(base64String: string) {
  if (!base64String.startsWith('data:image/')) return 'image/png'
  return base64String.split(';')[0].split(':')[1]
}

export async function rewriteWithGemini(userPrompt: string) {
  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const geminiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const vertexAI = new VertexAI({ project: projectId, location: location })

  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  const rewritePrompt =
    'Give me only one option, give me only your answer for the new prompt, no introductionnary text. ' +
    'The prompt should use short sentences and keywords separated by commas as opposed to longer natural language descriptive prompts. ' +
    'Make this prompt a bit more specific while staying true to exactly what was asked, ' +
    'the prompt is: "${userPrompt}".'

  try {
    const resp = await generativeModel.generateContent(rewritePrompt)
    const contentResponse = await resp.response

    if ('error' in contentResponse) throw Error(await cleanResult(contentResponse.error))

    if (contentResponse.instances !== undefined && 'error' in contentResponse.instances[0].prompt)
      throw Error(await cleanResult(contentResponse.instances[0].prompt))

    const newPrompt = await cleanResult(contentResponse.candidates[0].content.parts[0].text)

    return newPrompt
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while rewriting prompt with Gemini.',
    }
  }
}

export async function getDescriptionFromGemini(base64Image: string, type: string) {
  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const geminiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const vertexAI = new VertexAI({ project: projectId, location: location })

  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  let descriptionPrompt = ''
  if (type === 'Person')
    descriptionPrompt =
      "State the primary subject in this image. Only use terms that describe a person's age and gender (e.g., boy, girl, man, woman). " +
      'Do not state what the person is doing, or other object present in the image. '
  if (type === 'Animal') descriptionPrompt = 'State the primary animal in this image. Only use its race. '
  if (type === 'Product')
    descriptionPrompt =
      'State the primary product in this image using the most common and simple term (e.g., chair, table, phone). ' +
      'If you recognize the brand or the model, use them. '
  if (type === 'Style')
    descriptionPrompt =
      "Describe the overall style of this image, not what is happening in it. Use terms like 'minimalist', 'vintage', 'surreal', 'abstract', 'modern', etc. "
  if (type === 'Default')
    descriptionPrompt =
      "State the primary subject in this image using the most common and simple term. Don't state what it is doing or where it is. "

  descriptionPrompt =
    descriptionPrompt +
    'Use a subject format of 40 characters or less, with no period at the end. ' +
    "If you can't generate the output, for instance because the image content is not matching the type, just send back 'Error'"

  const imagePart = {
    inline_data: {
      data: await processImageBase64(base64Image),
      mimeType: await getFormatFromBase64(base64Image),
    },
  }
  const textPart = {
    text: descriptionPrompt,
  }

  const reqData = {
    contents: [{ role: 'user', parts: [imagePart, textPart] }],
  }

  try {
    const resp = await generativeModel.generateContent(reqData)
    const contentResponse = await resp.response

    if ('error' in contentResponse) throw Error(await cleanResult(contentResponse.error))

    if (contentResponse.instances !== undefined && 'error' in contentResponse.instances[0].prompt)
      throw Error(await cleanResult(contentResponse.instances[0].prompt))

    const newDescription = await cleanResult(contentResponse.candidates[0].content.parts[0].text)

    if (newDescription.includes('Error')) return '(provided type is not matching image)'
    else return newDescription
  } catch (error) {
    console.error(JSON.stringify(truncateLog(error), undefined, 4))
    return {
      error: 'Error while getting description from Gemini.',
    }
  }
}
