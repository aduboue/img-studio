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

'use client'

import { createContext, useState, useEffect, useContext } from 'react'
import { exportStandardFields, ExportMediaFormFieldsI } from '../api/export-utils'
import { fetchJsonFromStorage } from '../api/cloud-storage/action'

export interface appContextDataI {
  gcsURI?: string
  userID?: string
  exportMetaOptions?: ExportMediaFormFieldsI
  isLoading: boolean
  imageToEdit?: string
  imageToVideo?: string
  promptToGenerateImage?: string
  promptToGenerateVideo?: string
}

interface AppContextType {
  appContext: appContextDataI | null
  setAppContext: React.Dispatch<React.SetStateAction<AppContextType['appContext']>>
  error: Error | string | null
  setError: React.Dispatch<React.SetStateAction<Error | string | null>>
}

export const appContextDataDefault = {
  gcsURI: '',
  userID: '',
  exportMetaOptions: undefined,
  isLoading: true,
  imageToEdit: '',
  imageToVideo: '',
  promptToGenerateImage: '',
  promptToGenerateVideo: '',
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
        // 0. Check if required environment variables are available
        if (
          !process.env.NEXT_PUBLIC_PROJECT_ID ||
          !process.env.NEXT_PUBLIC_VERTEX_API_LOCATION ||
          !process.env.NEXT_PUBLIC_GCS_BUCKET_LOCATION ||
          !process.env.NEXT_PUBLIC_GEMINI_MODEL ||
          !process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS ||
          !process.env.NEXT_PUBLIC_OUTPUT_BUCKET ||
          !process.env.NEXT_PUBLIC_TEAM_BUCKET ||
          !process.env.NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI
        ) {
          throw Error('Missing required environment variables')
        }

        if (process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && !process.env.NEXT_PUBLIC_SEG_MODEL) {
          throw Error('Missing required environment variables for editing')
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

        // 2. Set GCS URI for all edited/ generated images
        let gcsURI = `gs://${process.env.NEXT_PUBLIC_OUTPUT_BUCKET}`

        // 3. Check if export metadata options file exists
        let exportMetaOptions: any = {}
        const exportMetaOptionsURI = process.env.NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI
        try {
          exportMetaOptions = await fetchJsonFromStorage(exportMetaOptionsURI)
          if (!exportMetaOptions) throw Error('Not found')
        } catch (error) {
          throw Error('Could not fetch export metadata options')
        }
        const ExportImageFormFields: ExportMediaFormFieldsI = { ...exportStandardFields, ...exportMetaOptions }

        // 4. Update Context with all fetched data
        setAppContext({
          userID: fetchedUserID,
          gcsURI: gcsURI?.toString(),
          exportMetaOptions: ExportImageFormFields,
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
