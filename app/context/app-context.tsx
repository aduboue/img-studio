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
  const [appContext, setAppContext] = useState<AppContextType['appContext']>(null)
  const [error, setError] = useState<Error | string | null>(null)

  useEffect(() => {
    async function fetchAndUpdateContext() {
      try {
        // 1. Fetch User ID from client-side
        const response = await fetch('/api/google-auth')
        if (!response.ok) {
          //#TODO never goes here ?
          const errorData = await response.json()
          throw new Error(errorData.error || 'Authentication failed')
        }
        const authParams = await response.json()
        const client = authParams?.client

        const match = client.targetPrincipal.match(/^(.+?)@/)
        const fetchedUserID = match ? match[1] : ''

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
            setError(new Error('An unexpected error occurred while fetching generation image URI'))
            console.error(error)
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
            setError(new Error('An unexpected error occurred while fetching editing image URI'))
            console.error(error)
          }
        }

        // 4. Update Context with all fetched data
        setAppContext({
          userID: fetchedUserID,
          generationImageUri: generationImageUri?.toString(),
          editingImageUri: editingImageUri?.toString(),
          isLoading: false,
        })
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error)
        } else {
          setError(new Error('An unexpected error occurred'))
        }
        console.error(error)
        setAppContext(appContextDataDefault)
      }
    }

    fetchAndUpdateContext()
  }, [])

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
