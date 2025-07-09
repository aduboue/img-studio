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

const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
const geminiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
const vertexAI = new VertexAI({ project: projectId, location: location })

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
  return inputString.toString().replaceAll('\n', '').replaceAll(/\//g, '').replaceAll('*', '')
}

function getFormatFromBase64(base64String: string) {
  if (!base64String.startsWith('data:image/')) return 'image/png'
  return base64String.split(';')[0].split(':')[1]
}

export async function getDescriptionFromGemini(base64Image: string, type: string) {
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

export async function getFullReferenceDescription(base64Image: string, type: string) {
  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  let specificPromptInstructions = ''
  let activeCommonDetailedInstructions = ''

  // This is the set of common instructions for most types (Person, Animal, Product, Default)
  const generalCommonDetailedInstructions =
    " Your primary goal is to generate an exceptionally detailed, meticulous, and comprehensive description of the primary subject's visual attributes. " +
    '**The entire description should be concise, ideally around 100-120 words, and must not exceed 130 words.** ' +
    'While achieving this, strictly adhere to the following rules: ' +
    "1. Begin the description directly with the subject's characteristics, without any introductory phrases like 'This image shows...' or 'The subject is...'. " +
    '2. The description must focus exclusively on the visual attributes of the primary subject itself. ' +
    "3. Do NOT describe the subject's actions, what the subject is doing, its location, the surrounding environment, or the background. Confine the description strictly to the physical appearance of the subject. " +
    '4. Ensure the description paints a clear and vivid visual picture as if under close inspection, focusing on objective visual facts. ' +
    "If you cannot satisfy the primary goal (an exceptionally detailed, subject-focused visual description) while strictly adhering to all the numbered rules, or if the image content does not clearly match the requested type, is ambiguous, or if a meaningful description of a singular primary subject cannot be generated, then respond with the single word 'error'." // Changed 'Error' to 'error'

  // These are the tailored common instructions specifically for the 'Style' type
  const styleCommonDetailedInstructions =
    " Your primary goal is to generate an exceptionally detailed, meticulous, and comprehensive analysis of the image's overall artistic and visual style. " +
    '**The entire description should be concise, ideally around 100-120 words, and must not exceed 130 words.** ' +
    'While achieving this, strictly adhere to the following rules: ' +
    "1. Begin the description directly with the style's characteristics, without any introductory phrases like 'This image shows...'. " +
    "2. Focus on how visual elements collectively create the style. When discussing composition, color, lighting, and texture as they contribute to the style, you may refer to how these apply to the general forms, shapes, and atmosphere of the depicted scene. However, do NOT provide an inventory of discrete objects as if describing a scene's content, nor describe any narrative actions or specific, identifiable real-world locations. The emphasis is on the *how* of the style, not the *what* of the scene's literal content. " +
    '3. Ensure the description paints a clear and vivid visual picture of the style itself, focusing on objective visual analysis of its components. ' +
    "If a meaningful and detailed analysis of the image's style cannot be generated according to these exacting rules, or if the image is too ambiguous, respond with the single word 'error'."

  if (type === 'Person') {
    activeCommonDetailedInstructions = generalCommonDetailedInstructions
    specificPromptInstructions =
      'Provide an exceptionally detailed and meticulous description of the primary person in this image, focusing strictly on their physical appearance. Break down their appearance into specific regions and features, describing each with precision. ' +
      'Detail their apparent age range and gender. For their hair, describe its color nuances, style from roots to ends, length, texture (e.g., fine, coarse, wavy, straight, coily), and any specific characteristics like parting, layers, or highlights. ' +
      'For their face, provide granular details about eye color, iris patterns if visible, eye shape, eyelashes, eyebrows (shape, thickness, color), nose (shape of bridge, nostrils, tip), mouth and lip characteristics (shape, fullness, color, texture), chin, jawline, and skin (tone, texture, any visible pores or fine lines if clear). Describe any static facial expression (e.g., a gentle smile, a neutral look) by detailing the muscle positioning. ' +
      'Describe their build or physique (e.g., slender, muscular, average) if discernible. Enumerate and describe any unique identifying features like glasses (detailing frame style, material, color, lens appearance), tattoos (location, colors, subject matter if clear), scars, or birthmarks with precision. ' +
      '**The description must NOT mention any clothing, attire, or accessories other than the specified glasses.**'
  } else if (type === 'Animal') {
    activeCommonDetailedInstructions = generalCommonDetailedInstructions
    specificPromptInstructions =
      'Provide an exceptionally detailed and meticulous description of the primary animal in this image, focusing strictly on its physical characteristics. Break down its appearance into specific features and describe each with precision. ' +
      'Detail its species and breed (if identifiable). For its coat or covering, describe the primary and secondary color(s) and shades, intricate patterns (e.g., spots, stripes, patches – noting their shape, size, color, and exact distribution on the body), and texture (e.g., smooth, shaggy, sleek, dense, sparse, glossy, matte) of its fur, feathers, scales, or skin. ' +
      'Describe its approximate size, overall build (e.g., slender, robust, delicate, muscular), and specific body shape and proportions. ' +
      "Enumerate and describe any distinctive physical features with specificity: the shape and size of its head, ear shape and position (e.g., pricked, floppy, tufted), eye color and pupil shape, muzzle or beak (length, width, shape, color, nostril details), presence and nature of teeth or fangs if visible, tongue if visible, horns or antlers (size, shape, texture, color, number of points if applicable), neck (length, thickness), legs (number, length, thickness, joint appearance), paws or hooves or claws (shape, color, number of digits, claw details), tail (length, shape, covering, how it's held if static and characteristic), and any unique markings or physical traits not covered by general patterning. " +
      'If discernible, mention its apparent age (e.g., juvenile, adult, very old based on physical indicators). '
  } else if (type === 'Product') {
    activeCommonDetailedInstructions = generalCommonDetailedInstructions
    specificPromptInstructions =
      'Provide an exceptionally detailed and meticulous description of the primary product in this image, focusing strictly on its physical attributes. Break down the product into its constituent parts, components, and surfaces, describing each with precision, as if conducting a thorough visual inspection for a catalog or engineering specification. ' +
      'Detail its exact type (e.g., specific type of chair, smartphone model, winter jacket). Identify brand and model if any markings or distinct design cues are visible. ' +
      'For its materials, specify all visible types (e.g., polished chrome, brushed aluminum, matte plastic, specific wood like oak or walnut, type of fabric like corduroy or canvas, glass, ceramic) and describe their textures (e.g., smooth, grained, ribbed, dimpled, woven) and finishes (e.g., glossy, matte, satin, metallic). ' +
      'Describe all colors and shades present, and any patterns or graphical elements. Detail its overall shape and geometry, approximate dimensions or proportions if inferable. ' +
      'Describe each specific design element meticulously: for a jacket, this would include the collar type (e.g., stand-up, notch lapel), fastening mechanisms (e.g., specific type of zipper, buttons - their material, shape, and how they attach, snaps, Velcro), pocket design (e.g., welt, patch, zippered - their placement, size, flap details), cuff and hem finishing, stitching type and visibility, lining if visible, and any logos or tags. For a phone, describe screen borders, button placement and shape, port types and locations, camera lens arrangement, and casing details. For furniture, describe legs, supports, surfaces, joinery if visible, and hardware. ' +
      'Note any visible aspects of its construction, assembly, seams, or edges. The goal is a comprehensive inventory of all its visual characteristics. '
  } else if (type === 'Style') {
    activeCommonDetailedInstructions = styleCommonDetailedInstructions
    specificPromptInstructions =
      'Analyze and describe the overall artistic and visual style of this image with meticulous and analytical detail. ' +
      'Elaborate on stylistic elements such as: the dominant aesthetic (e.g., minimalist, vintage, surreal, abstract, modern, photorealistic, painterly, graphic novel art, cyberpunk, solarpunk), elaborating on how specific visual choices achieve this effect; ' +
      'the color palette – its range (e.g., monochromatic, analogous, complementary), specific hues, saturation, value, temperature, and how colors interact or are used to create harmony or contrast, noting dominant and accent colors; ' +
      'lighting techniques – the quality (hard, soft), direction, intensity, color of light, and its precise impact on mood, form, texture, and creation of highlights and shadows (e.g., volumetric lighting, neon glow, diffuse, chiaroscuro); ' +
      "compositional choices – adherence to or deviation from principles like the rule of thirds, leading lines, symmetry/asymmetry, balance, framing, viewpoint (e.g., low-angle, high-angle, eye-level), perspective (e.g., linear, atmospheric), and depth of field, and their effect on the viewer's focus and interpretation of the style; " +
      'prevalent textures (e.g., weathered stone, metallic sheen, organic overgrowth, digital noise) and patterns, noting their characteristics, repetition, and contribution to the style; ' +
      'and the overall mood or atmosphere the style distinctively creates (e.g., dystopian, ethereal, gritty, vibrant, mysterious, tranquil). Analyze how these visual and artistic elements interrelate to define the overall style comprehensively. '
  } else {
    activeCommonDetailedInstructions = generalCommonDetailedInstructions
    specificPromptInstructions =
      'Identify the single most prominent primary subject in this image. If a singular primary subject is clearly identifiable, ' +
      'provide an exceptionally detailed and meticulous description of its visual characteristics. This includes its specific category (e.g., a particular species of flower, a type of antique clock, a specific pastry, an abstract sculptural form). ' +
      'Then, provide a granular breakdown of its physical appearance: all visible colors and their shades, precise shapes and geometric forms, an estimation of its real-world size if inferable, all discernible textures (e.g., smooth, rough, porous, reflective, matte), types of materials it appears to be made of, and a detailed account of any specific parts, components, segments, layers, or markings. Describe each aspect with precision. ' +
      "If the image does not contain a singular, clearly identifiable primary subject that can be described in such exhaustive detail according to these rules (e.g., it is primarily a complex landscape or cityscape without a single dominant subject easily isolated from its context, or a very abstract pattern where 'subject' is ill-defined for this purpose), " +
      "or if describing it adequately requires detailing background, location, or actions, then respond with the single word 'Error'. "
  }

  const fullPrompt = specificPromptInstructions + activeCommonDetailedInstructions

  const imagePart = {
    inline_data: {
      data: base64Image.startsWith('data:') ? base64Image.split(',')[1] : base64Image,
      mimeType: getFormatFromBase64(base64Image),
    },
  }
  const textPart = {
    text: fullPrompt,
  }

  const reqData = {
    contents: [{ role: 'user', parts: [imagePart, textPart] }],
  }

  try {
    const resp = await generativeModel.generateContent(reqData)

    if (!resp.response) {
      console.error('No response object found from generateContent call.')
      return 'error'
    }

    const contentResponse = await resp.response

    // Assuming cleanResult and truncateLog are defined elsewhere
    if ('error' in contentResponse) throw Error(await cleanResult(contentResponse.error))

    if (contentResponse.instances !== undefined && 'error' in contentResponse.instances[0].prompt) {
      throw Error(await cleanResult(contentResponse.instances[0].prompt))
    }

    const newDescription = await cleanResult(contentResponse.candidates[0].content.parts[0].text)

    if (newDescription.includes('Error')) {
      // Checks if Gemini explicitly returned "Error" as instructed
      return '(provided type is not matching image or description could not be generated)'
    } else {
      return newDescription
    }
  } catch (error) {
    console.error(JSON.stringify(truncateLog(error), undefined, 4))
    return {
      error: 'Error while getting description from Gemini.',
    }
  }
}

export async function getPromptFromImageFromGemini(base64Image: string, target: 'Image' | 'Video') {
  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  const imagenPrompt = `Generate a highly detailed text prompt, suitable for a text-to-image model such as Imagen 3, to recreate the uploaded image with maximum accuracy. The prompt should describe these aspects of the image:
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

  const veoPrompt = `Generate a highly detailed text prompt, suitable for a text-to-video model such as **Veo**, to create a short video clip inspired by the uploaded image, focusing on dynamic action and visual storytelling. The prompt should describe these aspects for the video:
  1.  **Subject & Action:** Main objects/figures, their appearance, features, species (if applicable), clothing. Crucially, describe their **movements, actions, interactions, and any changes in expression or pose over the duration of the clip**. Be extremely specific (e.g., "a fluffy ginger cat with emerald green eyes slowly blinking, then stretching its front paws forward on a windowsill" instead of "a cat").
  2.  **Scene Composition & Camera Work:** Initial arrangement of subjects (centered, off-center, foreground, background). Specify the **camera angle and shot type (e.g., close-up, wide shot, POV) and describe any camera movement** (e.g., slow pan right, zoom in, tracking shot following the subject, static shot).
  3.  **Setting & Environmental Dynamics:** Environment, location, time of day, weather, including any **dynamic environmental elements** (e.g., "leaves blowing in the wind in a sun-dappled forest at golden hour," "rain streaking down a window in a cozy, dimly lit room at night").
  4.  **Visual Style:** Artistic style of the video (e.g., photorealistic, cinematic, anime, watercolor animation, gritty found footage, pixel art). Mention specific directors or cinematic styles if relevant.
  5.  **Lighting & Atmosphere:** Lighting conditions (bright sunlight, moody twilight, soft indoor lighting, dramatic shadows), its direction, intensity, and **how it might change or interact with the scene's motion**. This contributes to the overall mood (serene, joyful, mysterious, ominous).
  6.  **Color Palette:** Dominant colors and overall color scheme of the video (vibrant, desaturated, monochromatic, warm, cool tones), and if they shift.
  7.  **Key Textures:** Prominent textures of subjects and the environment relevant to the video's look and feel (smooth, rough, furry, metallic, wet, windswept).
  8.  **Video Clip Focus & Pacing:** Briefly suggest the overall pacing (e.g., slow and graceful, fast-paced action, serene and calm) and what key moment, action, or transformation the short video clip should focus on.

  **Output Format:** I want the prompt to be ONLY a single paragraph of text, directly usable by the text-to-video model **Veo**. **Do not add any conversational filler, preambles, or extra sentences like "Text-to-Video Prompt:". Do not format the output as a list or use any special characters like  .**
  **Example Output (Correct Format): "A cinematic, photorealistic short video clip of a Ragdoll cat with light cream and beige long fur, initially curled up sleeping on a sunlit wooden floor. The cat slowly awakens, stretches its paws out, and yawns widely, its bright blue eyes blinking open. The camera is at a low angle, close-up on the cat, with a very gentle zoom-out as it stretches. Dust motes drift in the warm sunlight streaming from a nearby window, creating a soft, hazy atmosphere. The background shows a slightly out-of-focus cozy living room. The dominant colors are warm wood tones, light cream, and soft blues. The clip should convey a serene and peaceful morning moment."**
  **Important:** The prompt must be highly descriptive, prioritizing key visual elements and **essential motion cues** for generating an engaging video clip. The prompt can be up to 75 tokens.`

  const imagePart = {
    inline_data: {
      data: base64Image.startsWith('data:') ? base64Image.split(',')[1] : base64Image,
      mimeType: getFormatFromBase64(base64Image),
    },
  }
  const textPart = {
    text: target === 'Image' ? imagenPrompt : veoPrompt,
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
