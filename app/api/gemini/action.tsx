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

export async function rewriteWithGemini(
  userPrompt: string,
  generationType: string,
  isPersonRefProvided?: boolean,
  isAnimalRefProvided?: boolean,
  isObjectRefProvided?: boolean,
  isStyleRefProvided?: boolean
) {
  const generativeModel = vertexAI.getGenerativeModel({
    model: geminiModel,
  })

  // REWRITE IMAGE PROMPT
  let rewriteImagePrompt = `You are an AI Image Prompt Synthesizer and Enhancer.
    Your mission is to take a user's core prompt and intelligently weave it together with information about any pre-defined visual references (for a specific person, animal, object, or overall style that the user has already visually defined elsewhere).
    Your goal is to produce a single, cohesive, detailed, and creative prompt suitable for a text-to-image model like Imagen.
    Prioritize enhancing the creativity and overall quality of the potential AI-generated image by adding context, actions, interactions, and richer details where appropriate, while strictly respecting the visual integrity of any provided references.
    Follow Google's prompt engineering best practices for clarity and specificity.

    **Core Directives:**`

  // 1 - Handling Subject References
  if (isPersonRefProvided)
    rewriteImagePrompt += `* **Referenced Person:**
        * **DO NOT** re-describe the physical appearance, features, or clothing of the referenced person; these are fixed by their reference.
        * **DO** focus on the user's prompt to detail:
          * **Actions & Pose:** What is this specific person *doing*? Describe their activity, pose, gestures, and expression in a way that adds context or creativity. If the user only describes location, creatively infer a suitable action or pose for that context.
          * **Location & Interaction:** Precisely where is this person within the scene? How are they interacting with the environment or other elements/subjects based on the user prompt or a creative addition?`

  if (isAnimalRefProvided)
    rewriteImagePrompt += `* **Referenced Animal:**
    * **DO NOT** re-describe the species, breed, colors, or physical features of the referenced animal; these are fixed.
    * **DO** focus on the user's prompt to detail:
      * **Actions & Behavior:** What is this specific animal *doing*? Describe its activity, pose, or behavior, adding creative context if the user only implies it.
      * **Location & Interaction:** Precisely where is this animal within the scene? How is it interacting with its environment or other elements?`

  if (isObjectRefProvided)
    rewriteImagePrompt += `* **Referenced Object:**
    * **DO NOT** re-describe the intrinsic visual properties (e.g., its fundamental design, color, material as per its reference) of the referenced object.
    * **DO** focus on the user's prompt to detail:
      * **Placement & Context:** Where is this specific object located within the scene? How is it positioned, oriented, or arranged? What is its immediate context or purpose in that location?
      * **Interaction & Scale:** How does it interact with other scene elements or subjects? What is its scale relative to them, or how does its placement contribute to the scene's narrative or composition?`

  // 2 - Handling aspects NOT covered by references
  rewriteImagePrompt += `* **Subject Details:**
    * **New Persons:** If the userPrompt introduces a person and no specific person reference is active for them, describe this person with vivid detail: apparent age, gender, ethnicity, hair style/color, facial features, body type, specific clothing (style, color, material that fits the scene), accessories, pose, actions, and expression. Be creative in adding plausible details if the user is vague.
    * **New Animals:** If the userPrompt introduces an animal and no specific animal reference is active for them, describe it with vivid detail: species, breed, colors, patterns, size, body shape, fur/feathers/scales, pose, actions, and key features. Add creative and fitting details.
    * **Other Objects/Elements:** For any other significant objects, items, or elements mentioned in the userPrompt that are not tied to a specific reference, describe them with relevant visual details (type, color, material, texture, state, specific characteristics) that enhance the scene's richness and creativity.`

  rewriteImagePrompt += `* **Scene Composition & Framing:**
    * Detail the overall arrangement of all subjects and elements.
    * Specify a creative and fitting camera angle, shot type (e.g., "Dynamic low-angle shot capturing the referenced person's determined expression as they [action]," "Intimate close-up of the referenced animal's paws interacting with [object]," "Establishing wide shot showing the referenced object as a small but significant part of a vast, atmospheric landscape").
    * Describe perspective, framing, and use of compositional principles (e.g., rule of thirds, leading lines, depth of field) to create a visually compelling image.
    * Ensure the placement and spatial relationships between referenced subjects and other elements are clear and contribute to the overall narrative or visual impact.`

  rewriteImagePrompt += `* **Environment & Atmosphere:**
    * Provide rich, imaginative details about the setting. Don't just state location; describe it.
    * **Location:** Specifics like "a forgotten, moss-covered library hidden deep in a mystical forest," "a vibrant, bustling alien marketplace on a terraformed moon, under twin suns," "the meticulously organized, minimalist control room of a sleek starship."
    * **Time of Day & Weather:** Be evocative (e.g., "the ethereal glow of a pre-dawn aurora borealis," "a torrential downpour illuminated by flickering neon signs," "the hazy, golden light of a perpetual sunset on a fantasy world").
    * **Background & Foreground:** Include significant elements that build the world and atmosphere, ensuring they complement the main subjects and any referenced style.`

  // 3 - Handling stylistic elements
  if (isStyleRefProvided)
    rewriteImagePrompt += `* **Overall Style:**
      * The artistic style, primary lighting characteristics (e.g., type of light sources, overall light quality like 'dramatic' or 'soft'), color palette, and mood/atmosphere are ALL PRE-DEFINED by an external style reference.
      * **CRITICAL: Your task is to describe the Subject, Composition, and Setting in a STYLE-NEUTRAL manner.**
      * **DO NOT:**
        * Use any words that imply a specific artistic style (e.g., "photo of", "painting of", "realistic", "impressionistic", "romantic", "dramatic cityscape", "ethereal glow").
        * Describe specific light qualities or colors that imply an artistic choice (e.g., "sunlight illuminates the scene", "soft golden light," "shimmering light," "cinematic lighting"). Instead, if lighting is part of the setting (e.g., user prompt implies "daytime"), state it factually and neutrally (e.g., "daylight conditions," "ambient light from streetlamps").
        * Describe colors in a way that suggests an artistic palette (e.g., "warm tones," "cool hues"). Describe object colors factually (e.g., "a red car," "green leaves").
        * Imply or state a mood or atmosphere (e.g., "romantic," "peaceful," "cyberpunk vibe" - the vibe comes from the reference, not your words here).
      * **DO (for Setting and Composition):**
        * Describe the *factual content* of the setting (e.g., "a rooftop," "a city street," "Eiffel Tower in the distance," "a nearby balcony").
        * Describe the *physical arrangement* and composition of elements.
        * Describe *natural/environmental* light sources if they are part of the basic scene description (e.g., "sun in the sky," "visible streetlamps," "moonlight") but NOT their artistic qualities or color.
      * Your output should be a purely factual, descriptive prompt of the scene's contents and layout, ready to be rendered *by* the external style reference. Think of it as providing the "blueprint" of the scene, and the style reference is the "renderer."`
  else
    rewriteImagePrompt += `* **Artistic Style (be creative and specific):**
      * Propose a distinct and fitting artistic style (e.g., "Hyperrealistic fantasy illustration, incredible detail, style of Brom," "Luminous impressionistic landscape,Alla Prima, style of Erin Hanson," "Gritty neo-noir comic book art, heavy shadows, style of Frank Miller," "Whimsical children's book illustration, soft watercolors, charming characters").
      * **Lighting (be evocative):**
        * Describe the lighting with artistic intent (e.g., "Dramatic chiaroscuro with a single, focused beam of light illuminating the subject's face," "Ethereal, volumetric rays of godlight breaking through ancient forest canopy," "Dynamic, colorful reflections from multiple neon sources on wet pavement").
      * **Color Palette (be descriptive and harmonious):**
        * Suggest a specific and evocative color palette (e.g., "A rich analogous palette of deep crimsons, burnt oranges, and ochre yellows, creating a fiery ambiance," "A cool, desaturated palette of slate blues, misty greys, and stark whites, with a single, startling accent of blood red").
      * **Mood/Atmosphere (be specific):**
        * Define the precise mood or atmosphere (e.g., "A sense of profound ancient mystery and quiet solitude," "An atmosphere of high-octane, futuristic urgency," "A feeling of tender, nostalgic warmth and comfort").`

  // 4 - Handling final touch ups & formatting
  rewriteImagePrompt += `**Your Task:**
    Based on the user's base prompt below, and strictly following all applicable instructions above regarding provided references (or their absence), synthesize and enhance it into a single, highly descriptive, creative, and coherent image generation prompt. Fill in unspecified details (like actions if only location is given) to elevate the creative potential.
    User's base prompt: "${userPrompt}"

    **Output Requirements:**
      * The final output MUST be ONLY the enhanced prompt itself.
      * It should be a single, well-structured sentence or a concise short paragraph.
      * Do NOT include any introductory phrases, explanations, headings, field labels (like "Subject:", "Style:"), or your own reasoning.
      * Aim for the enhanced prompt to be under 75 tokens if possible, but prioritize richness, creativity, and adherence to all reference-handling rules over strict token count if necessary to achieve a high-quality result.`

  // REWRITE VIDEO PROMPT
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
    '**The entire description should be concise, ideally around 100-120 words, and must not exceed 130 words.** ' + // New length constraint
    'While achieving this, strictly adhere to the following rules: ' +
    "1. Begin the description directly with the subject's characteristics, without any introductory phrases like 'This image shows...' or 'The subject is...'. " +
    '2. The description must focus exclusively on the visual attributes of the primary subject itself. ' +
    "3. Do NOT describe the subject's actions, what the subject is doing, its location, the surrounding environment, or the background. Confine the description strictly to the physical appearance of the subject. " +
    '4. Ensure the description paints a clear and vivid visual picture as if under close inspection, focusing on objective visual facts. ' +
    "If you cannot satisfy the primary goal (an exceptionally detailed, subject-focused visual description) while strictly adhering to all the numbered rules, or if the image content does not clearly match the requested type, is ambiguous, or if a meaningful description of a singular primary subject cannot be generated, then respond with the single word 'error'." // Changed 'Error' to 'error'

  // These are the tailored common instructions specifically for the 'Style' type
  const styleCommonDetailedInstructions =
    " Your primary goal is to generate an exceptionally detailed, meticulous, and comprehensive analysis of the image's overall artistic and visual style. " +
    '**The entire description should be concise, ideally around 100-120 words, and must not exceed 130 words.** ' + // New length constraint
    'While achieving this, strictly adhere to the following rules: ' +
    "1. Begin the description directly with the style's characteristics, without any introductory phrases like 'This image shows...'. " +
    "2. Focus on how visual elements collectively create the style. When discussing composition, color, lighting, and texture as they contribute to the style, you may refer to how these apply to the general forms, shapes, and atmosphere of the depicted scene. However, do NOT provide an inventory of discrete objects as if describing a scene's content, nor describe any narrative actions or specific, identifiable real-world locations. The emphasis is on the *how* of the style, not the *what* of the scene's literal content. " +
    '3. Ensure the description paints a clear and vivid visual picture of the style itself, focusing on objective visual analysis of its components. ' +
    "If a meaningful and detailed analysis of the image's style cannot be generated according to these exacting rules, or if the image is too ambiguous, respond with the single word 'error'." // Changed 'Error' to 'error'

  if (type === 'Person') {
    activeCommonDetailedInstructions = generalCommonDetailedInstructions
    specificPromptInstructions =
      'Provide an exceptionally detailed and meticulous description of the primary person in this image, focusing strictly on their physical appearance and attire. Break down their appearance into specific regions and features, describing each with precision. ' +
      'Detail their apparent age range and gender. For their hair, describe its color nuances, style from roots to ends, length, texture (e.g., fine, coarse, wavy, straight, coily), and any specific characteristics like parting, layers, or highlights. ' +
      'For their face, provide granular details about eye color, iris patterns if visible, eye shape, eyelashes, eyebrows (shape, thickness, color), nose (shape of bridge, nostrils, tip), mouth and lip characteristics (shape, fullness, color, texture), chin, jawline, and skin (tone, texture, any visible pores or fine lines if clear). Describe any static facial expression (e.g., a gentle smile, a neutral look) by detailing the muscle positioning. ' +
      'Describe their build or physique (e.g., slender, muscular, average) if discernible. Enumerate and describe any unique identifying features like glasses (detailing frame style, material, color, lens appearance), tattoos (location, colors, subject matter if clear), scars, or birthmarks with precision. ' +
      'For their attire, describe each visible garment (e.g., shirt, pants, dress, jacket) in exhaustive detail: its type, specific color(s) and shades, fabric type (e.g., cotton, silk, denim, knit) and weave if apparent, pattern (name it if possible, e.g., plaid, floral, pinstripe, and describe its scale and colors), fit (e.g., loose, fitted, oversized), and all specific features like collar type, neckline, sleeve style and length, cuffs, buttons (type, material, number), zippers (type, puller details), seams, hems, and any embellishments or logos. ' +
      'Also, describe any visible accessories like jewelry (earrings, necklaces, rings – specifying type, material, gemstones, clasp, and intricate design details), hats (style, material, brim, crown), belts (buckle, material, width), or bags with similar exhaustive detail. '
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

export async function getPromptFromImageFromGemini(base64Image: string) {
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
