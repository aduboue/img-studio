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

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const ffprobeInstaller = require('@ffprobe-installer/ffprobe')
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
ffmpeg.setFfmpegPath(ffmpegInstaller.path)
ffmpeg.setFfprobePath(ffprobeInstaller.path)

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

export async function copyImageToTeamBucket(sourceGcsUri: string, id: string) {
  const storage = new Storage({ projectId })

  try {
    if (!sourceGcsUri || !sourceGcsUri.startsWith('gs://')) {
      console.error('Invalid source GCS URI provided:', sourceGcsUri)
      return {
        error: 'Invalid source GCS URI format. It must start with gs://',
      }
    }
    if (!id) {
      console.error('Invalid id provided:', id)
      return {
        error: 'Invalid id. It cannot be empty.',
      }
    }

    const { bucketName, fileName } = await decomposeUri(sourceGcsUri)

    const destinationBucketName = process.env.NEXT_PUBLIC_TEAM_BUCKET

    if (!bucketName || !fileName || !destinationBucketName) throw new Error('Invalid source or destination URI.')

    const sourceObject = storage.bucket(bucketName).file(fileName)
    const destinationBucket = storage.bucket(destinationBucketName)
    const destinationFile = destinationBucket.file(id)

    // Check if file already exists in destination bucket, if not copy it
    const [exists] = await destinationFile.exists()
    if (!exists) await sourceObject.copy(destinationFile)

    return `gs://${destinationBucketName}/${id}`
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while moving media to team Library',
    }
  }
}

export async function downloadMediaFromGcs(gcsUri: string): Promise<{ data?: string; error?: string }> {
  const storage = new Storage()

  if (!gcsUri || !gcsUri.startsWith('gs://')) {
    console.error('Invalid GCS URI provided:', gcsUri)
    return {
      error: 'Invalid GCS URI format. It must start with gs://',
    }
  }

  try {
    const { bucketName, fileName } = await decomposeUri(gcsUri)

    if (!bucketName || !fileName) {
      console.error('Could not determine bucket name or file name from URI:', gcsUri)
      return {
        error: 'Invalid GCS URI, could not extract bucket or file name.',
      }
    }

    const [fileBuffer] = await storage.bucket(bucketName).file(fileName).download()
    const base64Data = fileBuffer.toString('base64')

    return {
      data: base64Data,
    }
  } catch (error: any) {
    console.error('Error during GCS file download:', error)

    const errorMessage = error.message || 'Error while downloading the media'
    return {
      error: errorMessage,
    }
  }
}

export async function downloadTempVideo(gcsUri: string): Promise<string> {
  const storage = new Storage()

  const { bucketName, fileName } = await decomposeUri(gcsUri)

  const tempFileName = `video_${Date.now()}_${path.basename(fileName)}`
  const tempFilePath = path.join(os.tmpdir(), tempFileName)

  await storage.bucket(bucketName).file(fileName).download({
    destination: tempFilePath,
  })

  return tempFilePath
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

export async function uploadBase64Image(
  base64Image: string,
  bucketName: string,
  objectName: string,
  contentType: string = 'image/png'
): Promise<{ success?: boolean; message?: string; error?: string; fileUrl?: string }> {
  const storage = new Storage({ projectId })

  if (!base64Image) return { error: 'Invalid base64 data.' }

  const imageBuffer = Buffer.from(base64Image, 'base64')
  const options = {
    destination: objectName,
    metadata: {
      contentType: contentType,
    },
  }

  try {
    await storage.bucket(bucketName).file(objectName).save(imageBuffer, options)

    const fileUrl = `gs://${bucketName}/${objectName}`

    return {
      success: true,
      message: `File uploaded to: ${fileUrl}`,
      fileUrl: fileUrl,
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      error: 'Error uploading file to Google Cloud Storage.',
    }
  }
}

export async function getVideoThumbnailBase64(
  videoSourceGcsUri: string,
  ratio: string
): Promise<{ thumbnailBase64Data?: string; mimeType?: string; error?: string }> {
  const outputMimeType = 'image/png'
  const tempThumbnailFileName = `thumbnail_${Date.now()}.png`
  const tempThumbnailPath = path.join(os.tmpdir(), tempThumbnailFileName)

  let localVideoPath: string | null = null

  try {
    // 1. Ensure video is locally accessible
    localVideoPath = await downloadTempVideo(videoSourceGcsUri)

    if (!localVideoPath) throw Error('Failed to download video')

    // 2. Use FFmpeg to extract the thumbnail
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(localVideoPath!).seekInput('00:00:01').frames(1) // Extract a single frame

      const size = ratio === '16:9' ? '320x180' : '180x320'
      command = command.size(size)
      command = command.outputFormat('image2')

      command
        .output(tempThumbnailPath)
        .on('end', () => {
          resolve()
        })
        .on('error', (err: { message: any }) => {
          console.error('FFmpeg Error:', err.message)
          reject(new Error(`FFmpeg failed to extract thumbnail: ${err.message}`))
        })
        .run()
    })

    // 3. Read the generated thumbnail file into a buffer
    const thumbnailBuffer = await fs.readFile(tempThumbnailPath)

    // 4. Convert buffer to base64 string
    const thumbnailBase64Data = thumbnailBuffer.toString('base64')

    return {
      thumbnailBase64Data,
      mimeType: outputMimeType,
    }
  } catch (error: any) {
    console.error('Error in getVideoThumbnailBase64:', error)
    return { error: error.message || 'An unexpected error occurred while generating thumbnail.' }
  } finally {
    // 5. Cleanup temporary files
    if (localVideoPath)
      await fs
        .unlink(localVideoPath)
        .catch((err: any) => console.error(`Failed to delete temp video file: ${localVideoPath}`, err))

    // Attempt to delete the temp thumbnail even if an error occurred earlier
    await fs.unlink(tempThumbnailPath).catch((err: { code: string }) => {
      if (err.code !== 'ENOENT') console.error(`Failed to delete temp thumbnail file: ${tempThumbnailPath}`, err)
    })
  }
}
