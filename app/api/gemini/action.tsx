'use server'

const { VertexAI } = require('@google-cloud/vertexai')

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
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

    if ('error' in contentResponse) {
      throw Error(cleanResult(contentResponse.error))
    }

    if (contentResponse.instances !== undefined && 'error' in contentResponse.instances[0].prompt) {
      throw Error(cleanResult(contentResponse.instances[0].prompt))
    }

    const newPrompt = cleanResult(contentResponse.candidates[0].content.parts[0].text)

    return newPrompt
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while rewriting prompt with Gemini .',
    }
  }
}
