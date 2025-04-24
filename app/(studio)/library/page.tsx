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

import * as React from 'react'
import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'

import { Typography } from '@mui/material'

import theme from '../../theme'
import { getSignedURL } from '@/app/api/cloud-storage/action'
import { ExportErrorWarning } from '@/app/ui/transverse-components/ExportAlerts'
import { fetchDocumentsInBatches } from '@/app/api/firestore/action'
import { MediaMetadataWithSignedUrl } from '@/app/api/export-utils'
import LibraryMediasDisplay from '../../ui/library-components/LibraryMediasDisplay'
import LibraryFiltering from '../../ui/library-components/LibraryFiltering'
const { palette } = theme

export default function Page() {
  const [errorMsg, setErrorMsg] = useState('')
  const [isMediasLoading, setIsMediasLoading] = useState(false)
  const [fetchedMediasByPage, setFetchedMediasByPage] = useState<MediaMetadataWithSignedUrl[][]>([])
  const [lastVisibleDocument, setLastVisibleDocument] = useState<any | null>(null)
  const [isMorePageToLoad, setisMorePageToLoad] = useState(false)
  const [filters, setFilters] = useState(null)
  const [openFilters, setOpenFilters] = useState(false)

  const fetchDataAndSignedUrls = async (filters: any) => {
    setIsMediasLoading(true)
    setisMorePageToLoad(false)

    const selectedFilters = Object.entries(filters)
      .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : value !== undefined))
      .reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {} as any)

    try {
      let res
      if (Object.values(selectedFilters).length === 0) {
        res = await fetchDocumentsInBatches(lastVisibleDocument)
      } else {
        res = await fetchDocumentsInBatches(lastVisibleDocument, selectedFilters)
      }

      if ('error' in res && res.error) {
        const errorMsg = res['error'].replaceAll('Error: ', '')
        throw Error(errorMsg)
      }

      const documents = res.thisBatchDocuments || []
      if (documents.length === 0) {
        setErrorMsg('Sorry, your search returned no results')
        setOpenFilters(true)
        setIsMediasLoading(false)
        return
      }

      // Get signed URL for both media, and thumbnail if video
      const documentsWithSignedUrls = await Promise.all(
        documents.flatMap(async (doc: { gcsURI: string; videoThumbnailGcsUri?: string }) => {
          if (!doc.gcsURI) return { ...doc, signedUrl: '' } as MediaMetadataWithSignedUrl

          try {
            const signedUrl = await getSignedURL(doc.gcsURI)
            if (signedUrl.error) {
              const errorMsg = signedUrl['error'].replaceAll('Error: ', '')
              throw Error(errorMsg)
            }

            let thumbnailSignedUrl = null
            if (doc.videoThumbnailGcsUri) {
              thumbnailSignedUrl = await getSignedURL(doc.videoThumbnailGcsUri)
              if (thumbnailSignedUrl.error) {
                const errorMsg = signedUrl['error'].replaceAll('Error: ', '')
                throw Error(errorMsg)
              }
            }

            if (thumbnailSignedUrl)
              return {
                ...doc,
                signedUrl: signedUrl,
                videoThumbnailSignedUrl: thumbnailSignedUrl,
              } as MediaMetadataWithSignedUrl
            else return { ...doc, signedUrl: signedUrl } as MediaMetadataWithSignedUrl
          } catch (error) {
            console.error('Error fetching signed URL:', error)
            return { ...doc, signedUrl: '' } as MediaMetadataWithSignedUrl
          }
        })
      )

      if (
        res.isMorePageToLoad !== undefined &&
        documentsWithSignedUrls &&
        documentsWithSignedUrls.length !== 0 &&
        !res.error
      ) {
        setLastVisibleDocument(res.lastVisibleDocument)
        res.isMorePageToLoad && setisMorePageToLoad(res.isMorePageToLoad)
        const newFetchedMediasByPage = fetchedMediasByPage
          ? fetchedMediasByPage.concat([documentsWithSignedUrls])
          : [documentsWithSignedUrls]
        setFetchedMediasByPage(newFetchedMediasByPage)
      }
      setIsMediasLoading(false)
    } catch (error) {
      console.error(error)
      setErrorMsg('An error occurred while fetching medias. Please try again later.')
      setOpenFilters(true)
      setIsMediasLoading(false)
    }
  }

  const submitFilters = async (filters: any) => {
    setIsMediasLoading(true)
    setFetchedMediasByPage([])
    setLastVisibleDocument(null)
    setisMorePageToLoad(false)
    setErrorMsg('')
    setOpenFilters(false)
    setFilters(filters)
  }

  useEffect(() => {
    if (lastVisibleDocument === null && filters !== null) {
      fetchDataAndSignedUrls(filters).catch((error) => {
        console.error(error)
        setErrorMsg('An error occurred while fetching medias. Please try again later.')
        setOpenFilters(true)
        setIsMediasLoading(false)
      })
    }
  }, [filters])

  useEffect(() => {
    setIsMediasLoading(true)
    fetchDataAndSignedUrls({})
  }, [])

  const handleLoadMore = async () => {
    if (lastVisibleDocument) {
      setIsMediasLoading(true)
      await fetchDataAndSignedUrls(filters ?? {})
    }
  }

  return (
    <>
      <Box p={5} sx={{ maxHeight: '100vh', width: '100%', overflowY: 'scroll' }}>
        <Box sx={{ pb: 5, pt: 1.5 }}>
          <Typography display="inline" variant="h1" color={palette.text.secondary} sx={{ fontSize: '1.8rem' }}>
            {'Library/'}
          </Typography>
          <Typography
            display="inline"
            variant="h1"
            color={palette.primary.main}
            sx={{ fontWeight: 500, fontSize: '2rem', pl: 1 }}
          >
            {'Shared content'}
          </Typography>
        </Box>
        {errorMsg !== '' && (
          <ExportErrorWarning
            errorMsg={errorMsg}
            onClose={() => {
              setIsMediasLoading(false)
              setErrorMsg('')
              setOpenFilters(true)
            }}
          />
        )}
        <LibraryFiltering
          isMediasLoading={isMediasLoading}
          setIsMediasLoading={setIsMediasLoading}
          setErrorMsg={setErrorMsg}
          submitFilters={(filters: any) => submitFilters(filters)}
          openFilters={openFilters}
          setOpenFilters={setOpenFilters}
        />
        <LibraryMediasDisplay
          isMediasLoading={isMediasLoading}
          fetchedMediasByPage={fetchedMediasByPage}
          handleLoadMore={handleLoadMore}
          isMorePageToLoad={isMorePageToLoad}
        />
      </Box>
    </>
  )
}
