// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use server'

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

export async function rewriteWithGemini(userPrompt: string, generationType: string) {
  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const geminiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const vertexAI = new VertexAI({ project: projectId, location: location })

  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  const rewriteImagePrompt = `You are an AI image prompt enhancer.
  Your task is to take a user-provided prompt designed for a text-to-image model like Imagen and enhance it according to Google's recommended prompt engineering guidelines.
  These guidelines emphasize clarity, specificity, and detail to achieve high-quality and predictable results.

  Focus on improving the prompt in the following areas:
  * **Subject:**  Be extremely specific about the main subject.  Include species, breed, color, size, pose, clothing (if applicable), and any distinctive features.  Instead of "a dog," use "a golden retriever puppy wearing a red bandana, sitting and looking curious."
  * **Composition:** Describe the arrangement of elements in the scene.  Mention camera angle (e.g., close-up, wide shot, aerial view), perspective, framing, and use of the rule of thirds.  For example, "a close-up portrait of the puppy, centered in the frame."
  * **Setting:** Provide detailed information about the environment.  Include location, time of day, weather, lighting, and background details.  For example, "in a sunny park with green grass and tall trees, during golden hour."
  * **Style:** Specify the desired artistic style.  Be precise.  Instead of "realistic," consider "photorealistic, like a National Geographic photograph," or "impressionistic painting, in the style of Monet."  You can also mention specific artists, art movements, or mediums.
  * **Lighting:** Describe the lighting conditions.  Mention the source, direction, intensity, and color of the light.  For example, "soft, natural light from the setting sun, casting long shadows."
  * **Color Palette:** Specify the dominant colors and overall color scheme.  For example, "warm and earthy tones, with pops of red and green."
  * **Mood/Atmosphere:** Describe the overall feeling you want the image to evoke.  For example, "playful and joyful."

  **Input:**  The user-provided Imagen prompt: "${userPrompt}"
  **Output:**  The enhanced prompt, ready for a text-to-image model.  The output should be a single, well-structured sentence or a short paragraph.  Do not include any introductory or explanatory text.  The enhanced prompt should be concise yet detailed, maximizing the information conveyed within a reasonable length.  Prioritize the most visually important elements.  Aim for a prompt that is under 75 tokens if possible.

  **Example:**
  **Input:**  "A cat sitting on a mat."
  **Output:** "A fluffy, grey tabby cat with green eyes, curled up asleep on a woven, beige doormat in a brightly lit living room with a large window, late afternoon light casting long shadows, photorealistic style, calm and peaceful mood."`

  const rewriteVideoPrompt = `You are an AI video prompt enhancer.
  Your task is to take a user-provided prompt designed for a text-to-video model (like Veo) and enhance it according to Google's recommended prompt engineering guidelines for video generation.
  These guidelines emphasize clarity, specificity, detail, action, and camera work to achieve high-quality, dynamic, and predictable video results.

  Focus on improving the prompt in the following areas:
  * **Subject:** Be specific about the main subject(s). Include age, appearance, clothing, species, breed, color, size, and any distinctive features. (e.g., "a joyful woman in her early 30s with curly brown hair, wearing a yellow raincoat")
  * **Scene:** Describe the environment/location clearly. Include place, time of day, weather, and key background details. (e.g., "on a bustling Parisian street corner during a light spring shower")
  * **Action:** Detail what the subject is actively doing during the shot. Be specific about the movement or activity. (e.g., "laughing as she opens a bright red umbrella")
  * **Camera Motion:** Specify how the camera moves or its perspective. Use terms like tracking shot, panning, tilting, dolly zoom, handheld, static shot, drone view, aerial shot, POV shot, orbit shot, etc. (e.g., "Slow-motion orbiting shot")
  * **Style:** Define the overall aesthetic and visual treatment. Mention cinematic, animation style (e.g., 3D cartoon, anime), film look (e.g., vintage film, film noir), documentary, etc. (e.g., "cinematic, high definition")
  * **Composition:** Describe the framing and angle of the shot. Use terms like wide shot, medium shot, close-up, extreme close-up, low angle, high angle, eye-level, over-the-shoulder, etc. (e.g., "medium shot framing her from the waist up")
  * **Ambiance:** Convey the mood using descriptions of lighting and color. Mention time of day lighting (e.g., golden hour, night scene, overcast daylight), color temperature (e.g., warm tones, cool blue tones), and overall mood (e.g., dramatic, cheerful, mysterious). (e.g., "overcast daylight with bright, cheerful colors contrasted against grey skies")

  **Input:** The user-provided Veo prompt: "${userPrompt}"
  **Output:** The enhanced prompt, ready for a text-to-video model. The output should be a single, well-structured sentence or a short paragraph. Do not include any introductory or explanatory text. The enhanced prompt should be concise yet detailed, prioritizing the most visually important elements and describing the key action and camera work. Aim for a prompt that is under 75 tokens if possible.

  **Example:**
  **Input:** "A dog running in a park."
  **Output:** "Cinematic tracking shot following a Golden Retriever puppy running excitedly through a green park field, chasing a red ball, bright sunny afternoon light, wide shot capturing the dog's movement and the expanse of the park, joyful and energetic mood."`

  try {
    const resp = await generativeModel.generateContent(
      generationType === 'Image' ? rewriteImagePrompt : rewriteVideoPrompt
    )
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
      data: base64Image.startsWith('data:') ? base64Image.split(',')[1] : base64Image,
      mimeType: getFormatFromBase64(base64Image),
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

export async function getPromptFromImageFromGemini(base64Image: string) {
  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const geminiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const vertexAI = new VertexAI({ project: projectId, location: location })

  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  const prompt = `Generate a highly detailed text prompt, suitable for a text-to-image model such as Imagen 3, to recreate the uploaded image with maximum accuracy. The prompt should describe these aspects of the image:
  1.  **Subject:**  Main objects/figures, appearance, features, species (if applicable), clothing, pose, actions. Be extremely specific (e.g., "a fluffy ginger cat with emerald green eyes sitting on a windowsill" instead of "a cat").
  2.  **Composition:** Arrangement of subjects (centered, off-center, foreground, background), perspective/camera angle (close-up, wide shot, bird's-eye view).
  3.  **Setting:** Environment, location, time of day, weather. Be specific (e.g., "a dimly lit, ornate library with towering bookshelves" instead of "a library").
  4.  **Style:** Artistic style (photorealistic, oil painting, watercolor, cartoon, pixel art, abstract). Mention specific artists if relevant.
  5.  **Lighting:** Lighting conditions (bright sunlight, soft indoor lighting, dramatic shadows, backlighting), direction and intensity of light.
  6.  **Color Palette:** Dominant colors, overall color scheme (vibrant, muted, monochromatic, warm, cool).
  7.  **Texture:** Textures of objects and surfaces (smooth, rough, furry, metallic, glossy).
  8.  **Mood/Atmosphere:** Overall feeling or emotion (serene, joyful, mysterious, ominous).

  **Output Format:**  I want the prompt to be ONLY a single paragraph of text, directly usable by the text-to-image model.  **Do not add any conversational filler, preambles, or extra sentences like "Text-to-Image Prompt:". Do not format the output as a list or use any special characters like <0xC2><0xA0>.**
  **Example Output (Correct Format): "A photorealistic image of a Ragdoll or Birman cat with light cream and beige long fur, sitting upright on a kitchen counter or appliance with its paws tucked beneath it. The cat has bright blue eyes, a small pink nose, and pointed, tufted ears. Its tail is long and fluffy, draping down behind it. The background is slightly blurred and features a dark horizontal band suggesting an appliance, and a glass partition with black metal frames. The lighting is soft and diffused, illuminating the cat evenly. The dominant colors are light cream, beige, white, blue, and black. The overall style is realistic photography with a focus on detail and natural lighting. The image conveys a sense of calmness and gentle curiosity."
  **Important:** The prompt must be highly descriptive, prioritizing the most visually important elements for accurate recreation. The prompt can be up to 75 tokens.`

  const imagePart = {
    inline_data: {
      data: base64Image.startsWith('data:') ? base64Image.split(',')[1] : base64Image,
      mimeType: getFormatFromBase64(base64Image),
    },
  }
  const textPart = {
    text: prompt,
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

    const newDescription = contentResponse.candidates[0].content.parts[0].text.replace(/  +/g, ' ').trimEnd()

    if (newDescription.includes('Error')) return '(provided type is not matching image)'
    else return newDescription
  } catch (error) {
    console.error(JSON.stringify(truncateLog(error), undefined, 4))
    return {
      error: 'Error while getting prompt from Image with Gemini.',
    }
  }
}
