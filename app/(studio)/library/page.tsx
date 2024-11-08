'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'

import { Typography } from '@mui/material'

import theme from '../../theme'
import { getSignedURL } from '@/app/api/cloud-storage/action'
import { ExportErrorWarning } from '@/app/ui/transverse-components/ExportAlerts'
import { fetchDocumentsInBatches } from '@/app/api/firestore/action'
import { ImageMetadataWithSignedUrl } from '@/app/api/export-utils'
import LibraryImagesDisplay from '@/app/ui/library-components/LibraryImagesDisplay'
import LibraryFiltering from '../../ui/library-components/LibraryFiltering'
const { palette } = theme

export default function Page() {
  const [errorMsg, setErrorMsg] = useState('')
  const [isImagesLoading, setIsImagesLoading] = useState(false)
  const [fetchedImagesByPage, setFetchedImagesByPage] = useState<ImageMetadataWithSignedUrl[][]>([])
  const [lastVisibleDocument, setLastVisibleDocument] = useState<any | null>(null)
  const [isMorePageToLoad, setisMorePageToLoad] = useState(false)
  const [filters, setFilters] = useState(null)
  const [openFilters, setOpenFilters] = useState(false)

  const fetchDataAndSignedUrls = async (filters: any) => {
    setIsImagesLoading(true)
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
        setIsImagesLoading(false)
        return
      }

      const documentsWithSignedUrls = await Promise.all(
        documents.flatMap(async (doc: { imageGcsURI: string }) => {
          if (!doc.imageGcsURI) return { ...doc, signedUrl: '' } as ImageMetadataWithSignedUrl

          try {
            const signedUrl = await getSignedURL(doc.imageGcsURI)

            if (signedUrl.error) {
              const errorMsg = signedUrl['error'].replaceAll('Error: ', '')
              throw Error(errorMsg)
            }

            return { ...doc, signedUrl: signedUrl } as ImageMetadataWithSignedUrl
          } catch (error) {
            console.error('Error fetching signed URL:', error)
            return { ...doc, signedUrl: '' } as ImageMetadataWithSignedUrl
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
        const newFetchedImagesByPage = fetchedImagesByPage
          ? fetchedImagesByPage.concat([documentsWithSignedUrls])
          : [documentsWithSignedUrls]
        setFetchedImagesByPage(newFetchedImagesByPage)
      }
      setIsImagesLoading(false)
    } catch (error) {
      console.error(error)
      setErrorMsg('An error occurred while fetching images. Please try again later.')
      setOpenFilters(true)
      setIsImagesLoading(false)
    }
  }

  const submitFilters = async (filters: any) => {
    setIsImagesLoading(true)
    setFetchedImagesByPage([])
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
        setErrorMsg('An error occurred while fetching images. Please try again later.')
        setOpenFilters(true)
        setIsImagesLoading(false)
      })
    }
  }, [filters])

  useEffect(() => {
    setIsImagesLoading(true)
    fetchDataAndSignedUrls({})
  }, [])

  const handleLoadMore = async () => {
    if (lastVisibleDocument) {
      setIsImagesLoading(true)
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
              setIsImagesLoading(false)
              setErrorMsg('')
              setOpenFilters(true)
            }}
          />
        )}
        <LibraryFiltering
          isImagesLoading={isImagesLoading}
          setIsImagesLoading={setIsImagesLoading}
          setErrorMsg={setErrorMsg}
          submitFilters={(filters: any) => submitFilters(filters)}
          openFilters={openFilters}
          setOpenFilters={setOpenFilters}
        />
        <LibraryImagesDisplay
          isImagesLoading={isImagesLoading}
          fetchedImagesByPage={fetchedImagesByPage}
          handleLoadMore={handleLoadMore}
          isMorePageToLoad={isMorePageToLoad}
        />
      </Box>
    </>
  )
}
