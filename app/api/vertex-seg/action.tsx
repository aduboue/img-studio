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

const { GoogleAuth } = require('google-auth-library')

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
          bytesBase64Encoded: imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64,
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
      bytesBase64Encoded: maskImage.startsWith('data:') ? maskImage.split(',')[1] : maskImage,
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
    let segmentation = res.data.predictions[0].bytesBase64Encoded

    if (!segmentation.startsWith('data:')) segmentation = `data:image/png;base64,${segmentation}`

    return segmentation
  } catch (error) {
    console.error(error)
    return {
      error: 'Issue while segmenting image.',
    }
  }
}
