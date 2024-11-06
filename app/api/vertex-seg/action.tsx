'use server'

const { GoogleAuth } = require('google-auth-library')

export async function processImageBase64(imageBase64: string): Promise<string> {
  return new Promise<string>((resolve) => {
    // 1. Handle data URI scheme (if present)
    if (imageBase64.startsWith('data:')) imageBase64 = imageBase64.split(',')[1]

    // 2. (Optional) Add padding if necessary
    while (imageBase64.length % 4 !== 0) imageBase64 += '='

    resolve(imageBase64)
  })
}

export async function buildImageSrcFromBase64(base64Data: string, mimeType = 'image/png'): Promise<string> {
  return new Promise<string>((resolve) => {
    // 1. (Optional) Prepend data URI scheme if needed
    let imageSrc = base64Data
    if (!imageSrc.startsWith('data:')) imageSrc = `data:${mimeType};base64,${base64Data}`

    resolve(imageSrc)
  })
}

export async function segmentImage(
  imageBase64: string,
  segMode: string,
  semanticSelection: string[],
  promptSelection: string,
  maskImage: string
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
      error: 'Unable to authenticate your account to access model',
    }
  }
  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
  const modelVersion = process.env.NEXT_PUBLIC_SEG_MODEL
  const segAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`

  // 2 - Building Imagen request body
  const reqData = {
    instances: [
      {
        image: {
          bytesBase64Encoded: await processImageBase64(imageBase64),
        },
      },
    ],
    parameters: {
      mode: segMode,
      maxPredictions: 1,
    },
  }
  if (segMode === 'prompt') {
    ;(reqData.instances[0] as any).prompt = promptSelection
  }
  if (segMode === 'semantic') {
    ;(reqData.instances[0] as any).prompt = semanticSelection.toString().toLocaleLowerCase()
  }
  if (segMode === 'interactive') {
    ;(reqData.instances[0] as any).scribble = {}
    ;(reqData.instances[0] as any).scribble.image = {
      bytesBase64Encoded: await processImageBase64(maskImage),
    }
  }

  const opts = {
    url: segAPIurl,
    method: 'POST',
    data: reqData,
  }

  // 3 - Segment image
  try {
    const res = await client.request(opts)

    if (res.data.predictions === undefined) {
      throw Error('There were an issue, no segmentation were done')
    }

    console.log('Image segmented with success')
    const segmentation = res.data.predictions[0].bytesBase64Encoded

    return buildImageSrcFromBase64(segmentation)
  } catch (error) {
    console.error(error)
    return {
      error: 'Issue while segmenting image.',
    }
  }
}
