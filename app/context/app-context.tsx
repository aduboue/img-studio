'use client'

import { createContext, useState, useEffect, useContext } from 'react'
import { ensureBucketExists } from '../api/cloud-storage/action'

export interface appContextDataI {
  generationImageUri?: string
  editingImageUri?: string
  userID?: string
  isLoading: boolean
}

interface AppContextType {
  appContext: appContextDataI | null
  setAppContext: React.Dispatch<React.SetStateAction<AppContextType['appContext']>>
  error: Error | string | null
  setError: React.Dispatch<React.SetStateAction<Error | string | null>>
}

const appContextDataDefault = {
  generationImageUri: '',
  editingImageUri: '',
  userID: '',
  isLoading: true,
}

const AppContext = createContext<AppContextType>({
  appContext: appContextDataDefault,
  setAppContext: () => {},
  error: null,
  setError: () => {},
})

export function ContextProvider({ children }: { children: React.ReactNode }) {
  const [appContext, setAppContext] = useState<AppContextType['appContext']>(appContextDataDefault)
  const [error, setError] = useState<Error | string | null>(null)
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    async function fetchAndUpdateContext() {
      try {
        console.log('XXXXXX env ' + process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_PREFIX) //#TODO take out !!

        // 0. Check if required environment variables are available
        if (
          !process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_PREFIX ||
          !process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_SUFIX ||
          !process.env.NEXT_PUBLIC_GENERATED_IMAGE_BUCKET_PREFIX ||
          !process.env.NEXT_PUBLIC_EDITED_IMAGE_BUCKET_PREFIX
        ) {
          throw Error('Missing required environment variables')
        }

        // 1. Fetch User ID from client-side
        const response = await fetch('/api/google-auth')
        const authParams = await response.json()
        if (typeof authParams === 'object' && 'error' in authParams) {
          throw Error(authParams.error)
        }

        let targetPrincipal

        if (authParams !== undefined && authParams['targetPrincipal'] !== undefined) {
          targetPrincipal = authParams['targetPrincipal']
          targetPrincipal = targetPrincipal.replace('accounts.google.com:', '') // For IAP provided emails
          targetPrincipal = targetPrincipal.replace(process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_PREFIX, '') // Remove prefix part before ID
          targetPrincipal = targetPrincipal.replace(process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_SUFIX, '') // Remove sufix part after ID
        } else {
          throw Error('An unexpected error occurred while fetching User ID')
        }
        const fetchedUserID = targetPrincipal

        // 2. Fetch Generation Image URI (if userID is available)
        let generationImageUri
        if (fetchedUserID) {
          try {
            generationImageUri = await ensureBucketExists(
              `gs://${process.env.NEXT_PUBLIC_GENERATED_IMAGE_BUCKET_PREFIX}-${fetchedUserID}`
            )
            if (typeof generationImageUri === 'object' && 'error' in generationImageUri) {
              throw Error(generationImageUri.error)
            }
          } catch (error: unknown) {
            if (error instanceof Error) {
              throw error
            } else {
              throw Error(error as string)
            }
          }
        }

        // 3. Fetch Editing Image URI (if userID is available)
        let editingImageUri
        if (fetchedUserID) {
          try {
            editingImageUri = await ensureBucketExists(
              `gs://${process.env.NEXT_PUBLIC_EDITED_IMAGE_BUCKET_PREFIX}-${fetchedUserID}`
            )
            if (typeof editingImageUri === 'object' && 'error' in editingImageUri) {
              throw Error(editingImageUri.error)
            }
          } catch (error: unknown) {
            if (error instanceof Error) {
              throw error
            } else {
              throw Error(error as string)
            }
          }
        }

        // 4. Update Context with all fetched data
        setAppContext({
          userID: fetchedUserID,
          generationImageUri: generationImageUri?.toString(),
          editingImageUri: editingImageUri?.toString(),
          isLoading: false,
        })
        setRetries(0)
      } catch (error: unknown) {
        setError('An unexpected error occurred, retrying...')
        console.error(error)

        // Maximum 3 retries
        if (retries < 3) {
          console.error('Retrying fetch in 2 seconds...')
          setTimeout(() => {
            setRetries(retries + 1)
          }, 2000) // Retry after 2 seconds
        } else {
          setAppContext(appContextDataDefault)
          setError('Failed to fetch data after multiple retries')
        }
      }
    }

    fetchAndUpdateContext()
  }, [retries])

  const contextValue = {
    appContext,
    setAppContext,
    error,
    setError,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export function useAppContext() {
  return useContext(AppContext)
}
