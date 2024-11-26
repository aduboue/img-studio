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
    `Give me only one option, give me only your answer for the new prompt, no introductionnary text. ` +
    `The prompt should use short sentences and keywords separated by commas as opposed to longer natural language descriptive prompts. ` +
    `Make this prompt a bit more specific while staying true to exactly what was asked, ` +
    `the prompt is: "${userPrompt}".`

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
      'List the physical attributes of the person in this image.' +
      'Include details such as apparent age, hair color, gender, any prominent clothing or accessories. '
  if (type === 'Animal')
    descriptionPrompt =
      'List the physical attributes of the animal in this image.' +
      'Include details such as species, color, and prominent features like eye color or markings. '
  if (type === 'Product')
    descriptionPrompt =
      `List the physical attributes of the primary product in this image.` +
      `Include details such as type, color, or any other prominent features.` +
      `If you recognize the brand or the model add them in. `
  if (type === 'Style')
    descriptionPrompt =
      `Describe the style of this image only, not what's in it.` +
      `Include details such as lighting, colors, if it's a photograph a drawing or something else, the technique used.`
  if (type === 'Default')
    descriptionPrompt =
      `Describe this image in 80 characters or less in total, mentioning the primary object only, not its surroundings.` +
      `The description should contain if possible its type, color, any prominent features, etc.`

  descriptionPrompt =
    descriptionPrompt +
    'Format the description in a subject format of 80 characters or less, with no period at the end. '

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

    return newDescription
  } catch (error) {
    console.error(JSON.stringify(truncateLog(error), undefined, 4))
    return {
      error: 'Error while getting description from Gemini.',
    }
  }
}
