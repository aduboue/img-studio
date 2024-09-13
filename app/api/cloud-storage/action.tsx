'use server'

const { Storage } = require('@google-cloud/storage')

interface optionsI {
  version: 'v2' | 'v4'
  action: 'read' | 'write' | 'delete' | 'resumable'
  expires: number
}
const projectId = process.env.PROJECT_ID

export async function getSignedURL(bucketName: string, fileName: string) {
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

export async function ensureBucketExists(uri: string) {
  try {
    const storage = new Storage({ projectId })
    const bucketName = uri.replace(/^gs:\/\//, '')
    const [bucketExists] = await storage.bucket(bucketName).exists()
    const location = process.env.GCS_BUCKET_LOCATION

    if (!bucketExists) {
      await storage.createBucket(bucketName, {
        location: location,
      })

      console.log(`Created new bucket: ${bucketName}`)
    }

    return uri
  } catch (error) {
    console.error(error)
    return {
      error: 'Erorr while initializing content storage .',
    }
  }
}
