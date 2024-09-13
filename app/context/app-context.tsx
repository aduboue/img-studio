'use client'

import { createContext, useState, useEffect, useContext } from 'react'
import { ensureBucketExists } from '../api/cloud-storage/action'

export interface appContextDataI {
  gcsURI?: string
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
  gcsURI: '',
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
        console.log('XXXXXX env ' + process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS) //#TODO take out !!

        // 0. Check if required environment variables are available
        if (!process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS || !process.env.NEXT_PUBLIC_IMAGE_BUCKET_PREFIX) {
          throw Error('Missing required environment variables')
        }

        // 1. Fetch User ID from client-side
        let fetchedUserID = ''

        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_DEV_USER_ID) {
          // Locally IAP is not enabled
          fetchedUserID = process.env.NEXT_PUBLIC_TEST_DEV_USER_ID
        } else {
          // Fetching ID via IAP
          const response = await fetch('/api/google-auth')
          const authParams = await response.json()
          if (typeof authParams === 'object' && 'error' in authParams) {
            throw Error(authParams.error)
          }

          let targetPrincipal: string

          if (authParams !== undefined && authParams['targetPrincipal'] !== undefined) {
            targetPrincipal = authParams['targetPrincipal']
            const principalToUserFilters = process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS
              ? process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS
              : ''

            principalToUserFilters
              .split(',')
              .forEach((filter) => (targetPrincipal = targetPrincipal.replace(filter, '')))
          } else {
            throw Error('An unexpected error occurred while fetching User ID')
          }
          fetchedUserID = targetPrincipal
        }

        // 2. Fetch GCS URI for all edited/ generated images (if userID is available)
        let gcsURI
        if (fetchedUserID) {
          try {
            gcsURI = await ensureBucketExists(`gs://${process.env.NEXT_PUBLIC_IMAGE_BUCKET_PREFIX}-${fetchedUserID}`)
            if (typeof gcsURI === 'object' && 'error' in gcsURI) {
              throw Error(gcsURI.error)
            }
          } catch (error: unknown) {
            if (error instanceof Error) {
              throw error
            } else {
              throw Error(error as string)
            }
          }
        }

        // 3. Update Context with all fetched data
        setAppContext({
          userID: fetchedUserID,
          gcsURI: gcsURI?.toString(),
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
