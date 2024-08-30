'use server'

const { VertexAI } = require('@google-cloud/vertexai')

export async function rewriteWithGemini(userPrompt: string) {
  const location = process.env.VERTEX_API_LOCATION
  const projectId = process.env.PROJECT_ID
  const geminiModel = process.env.GEMINI_MODEL

  const vertexAI = new VertexAI({ project: 'aduboue-playground', location: location })

  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  const rewritePrompt =
    'Give me only one option, give me only your answer for the new prompt, no introductionnary text, can you make this prompt more performant and specific while staying true to exactly what was asked: ' +
    userPrompt

  try {
    debugger
    const resp = await generativeModel.generateContent(rewritePrompt)
    const contentResponse = await resp.response

    if ('error' in contentResponse) {
      throw Error(contentResponse.error.toString().replaceAll('\n', ''))
    }

    if (contentResponse.instances !== undefined && 'error' in contentResponse.instances[0].prompt) {
      throw Error(contentResponse.instances[0].prompt.toString().replaceAll('\n', ''))
    }

    const newPrompt = contentResponse.candidates[0].content.parts[0].text

    return newPrompt
  } catch (error) {
    return {
      error: `${error}`,
    }
  }
}
