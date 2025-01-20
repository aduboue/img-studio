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

const { Storage } = require('@google-cloud/storage')

interface optionsI {
  version: 'v2' | 'v4'
  action: 'read' | 'write' | 'delete' | 'resumable'
  expires: number
}
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

export async function decomposeUri(uri: string) {
  const sourceUriParts = uri.replace('gs://', '').split('/')
  const sourceBucketName = sourceUriParts[0]
  const sourceObjectName = sourceUriParts.slice(1).join('/')

  return {
    bucketName: sourceBucketName,
    fileName: sourceObjectName,
  }
}

export async function getSignedURL(gcsURI: string) {
  const { bucketName, fileName } = await decomposeUri(gcsURI)

  const storage = new Storage({ projectId })

  const options: optionsI = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  }

  try {
    const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options)
    return url
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while getting secured access to content.',
    }
  }
}

export async function copyImageToTeamBucket(actualGcsUri: string, imageID: string) {
  const storage = new Storage({ projectId })

  try {
    const { bucketName, fileName } = await decomposeUri(actualGcsUri)

    const destinationBucketName = process.env.NEXT_PUBLIC_TEAM_BUCKET

    if (!bucketName || !fileName || !destinationBucketName) {
      throw new Error('Invalid source or destination URI.')
    }

    const sourceObject = storage.bucket(bucketName).file(fileName)
    const destinationBucket = storage.bucket(destinationBucketName)
    const destinationFile = destinationBucket.file(imageID)

    // Check if file already exists in destination bucket
    const [exists] = await destinationFile.exists()

    if (!exists) {
      // File doesn't exist, proceed with copy
      await sourceObject.copy(destinationFile)
    }

    return `gs://${destinationBucketName}/${imageID}`
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while moving image to team Library',
    }
  }
}

export async function downloadImage(gcsUri: string) {
  const storage = new Storage({ projectId })

  const { bucketName, fileName } = await decomposeUri(gcsUri)

  try {
    const [res] = await storage.bucket(bucketName).file(fileName).download()

    const base64Image = Buffer.from(res).toString('base64')

    return {
      image: base64Image,
    }
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while downloading the image',
    }
  }
}

export async function fetchJsonFromStorage(gcsUri: string) {
  const storage = new Storage({ projectId })

  try {
    const { bucketName, fileName } = await decomposeUri(gcsUri)

    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)

    const [contents] = await file.download()

    const jsonData = JSON.parse(contents.toString())
    return jsonData
  } catch (error) {
    console.error('Error fetching JSON from storage:', error)
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error. Downloaded content might not be valid JSON.')
    }
    throw error
  }
}
