'use server'

const { VertexAI } = require('@google-cloud/vertexai')

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
}

export async function rewriteWithGemini(userPrompt: string) {
  const location = process.env.VERTEX_API_LOCATION
  const projectId = process.env.PROJECT_ID
  const geminiModel = process.env.GEMINI_MODEL

  const vertexAI = new VertexAI({ project: 'aduboue-playground', location: location })

  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  const rewritePrompt =
    `Give me only one option, give me only your answer for the new prompt, no introductionnary text. ` +
    `Make this prompt more performant and specific while staying true to exactly what was asked, ` +
    `the prompt is: "${userPrompt}".` +
    `In output prompt propositon, the part of the original prompt starting with 'With style: ...' until next period should be kept intact.`

  try {
    debugger
    const resp = await generativeModel.generateContent(rewritePrompt)
    const contentResponse = await resp.response

    if ('error' in contentResponse) {
      throw Error(cleanResult(contentResponse.error))
    }

    if (contentResponse.instances !== undefined && 'error' in contentResponse.instances[0].prompt) {
      throw Error(cleanResult(contentResponse.instances[0].prompt))
    }

    const newPrompt = cleanResult(contentResponse.candidates[0].content.parts[0].text)

    return newPrompt
  } catch (error) {
    return {
      error: `${error}`,
    }
  }
}
