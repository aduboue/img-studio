'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'

import { Typography } from '@mui/material'

import theme from '../../theme'
import { getSignedURL } from '@/app/api/cloud-storage/action'
import { ExportErrorWarning } from '@/app/ui/components/ExportAlerts'
import { fetchAllDocumentsInBatches, fetchedFilteredDocuments } from '@/app/api/firestore/action'
import { ImageMetadataI, ImageMetadataWithSignedUrl } from '@/app/api/export-utils'
import LibraryImagesDisplay from '@/app/ui/library-images-display'
import LibraryFiltering from '@/app/ui/library-filtering'
const { palette } = theme

export default function Page() {
  const [errorMsg, setErrorMsg] = useState('')
  const [isImagesLoading, setIsImagesLoading] = useState(false)

  const [fetchedImagesByPage, setFetchedImagesByPage] = useState<ImageMetadataWithSignedUrl[][]>([])

  const fetchDataAndSignedUrls = async (filters: any) => {
    setIsImagesLoading(true)

    const selectedFilters = Object.entries(filters)
      .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : value !== undefined))
      .reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {} as any)

    try {
      let documents: ImageMetadataI[][] | { error: string } = []
      if (Object.values(selectedFilters).length === 0) {
        documents = await fetchAllDocumentsInBatches(24)
      } else {
        documents = await fetchedFilteredDocuments(24, selectedFilters)
      }

      if (documents !== undefined && typeof documents === 'object' && 'error' in documents) {
        const errorMsg = documents['error'].replaceAll('Error: ', '')
        throw Error(errorMsg)
      }

      const documentsWithSignedUrls: ImageMetadataWithSignedUrl[][] = await Promise.all(
        documents.map(async (pageDocs) => {
          return Promise.all(
            pageDocs.map(async (doc) => {
              const docUri = doc.imageGcsURI
              if (docUri) {
                try {
                  const signedUrl = await getSignedURL(docUri)
                  return { ...doc, signedUrl } as ImageMetadataWithSignedUrl
                } catch (error) {
                  console.error('Error fetching signed URL:', error)
                  // Handle the error, e.g., set a default signedUrl or skip this document
                  return { ...doc, signedUrl: '' } as ImageMetadataWithSignedUrl
                }
              } else {
                return { ...doc, signedUrl: '' } as ImageMetadataWithSignedUrl
              }
            })
          )
        })
      )

      setFetchedImagesByPage(documentsWithSignedUrls)
      setIsImagesLoading(false)
    } catch (error) {
      console.error(error)
      setErrorMsg('An error occurred while fetching images. Please try again later.')
    }
  }

  const submitFilters = async (filters: any) => {
    await fetchDataAndSignedUrls(filters)
  }

  useEffect(() => {
    fetchDataAndSignedUrls({})
    console.log('useEffect useEffect useEffect') //TODO remove
  }, [])

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
            }}
          />
        )}
        <LibraryFiltering
          isImagesLoading={isImagesLoading}
          setIsImagesLoading={setIsImagesLoading}
          setErrorMsg={setErrorMsg}
          submitFilters={(filters: any) => submitFilters(filters)}
        />
        <LibraryImagesDisplay isImagesLoading={isImagesLoading} fetchedImagesByPage={fetchedImagesByPage} />
      </Box>
    </>
  )
}
