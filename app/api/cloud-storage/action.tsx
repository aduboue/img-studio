'use server'

const { Storage } = require('@google-cloud/storage')
const { GoogleAuth } = require('google-auth-library')

interface optionsI {
  version: 'v2' | 'v4'
  action: 'read' | 'write' | 'delete' | 'resumable'
  expires: number
}

export async function getSignedURL(bucketName: string, fileName: string) {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  })
  const projectId = await auth.getProjectId()
  const storage = new Storage({
    projectId,
  })

  const options: optionsI = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  }

  try {
    const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options)
    return url
  } catch (error) {
    return {
      error: `${error}`,
    }
  }
}
