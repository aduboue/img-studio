'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'

import {
  Avatar,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Modal,
  Pagination,
  Skeleton,
  Typography,
} from '@mui/material'

import theme from '../theme'
import { ImageMetadataI, ImageMetadataWithSignedUrl } from '@/app/api/export-utils'
import { blurDataURL } from '@/app/ui/components/blurImage'
import { FileUpload, Info, InfoSharp, QuestionMark } from '@mui/icons-material'
import image from 'next/image'
import { CustomizedAvatarButton, CustomizedIconButton } from './components/Button-SX'
import { ImageI } from '../api/generate-utils'
import ExploreDialog from './explore-dialog'
import CustomTooltip, { CustomWhiteTooltip } from './components/Tooltip'
const { palette } = theme

export default function LibraryImagesDisplay({
  isImagesLoading,
  fetchedImagesByPage,
}: {
  isImagesLoading: boolean
  fetchedImagesByPage: ImageMetadataWithSignedUrl[][]
}) {
  const [page, setPage] = useState(1)
  const [currentPageImages, setCurrentPageImages] = useState<ImageMetadataWithSignedUrl[]>([])
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage)
  }
  useEffect(() => {
    setCurrentPageImages(fetchedImagesByPage[page - 1] || [])
  }, [page, fetchedImagesByPage[page - 1]])

  // Full screen image display
  const [imageFullScreen, setImageFullScreen] = useState<ImageMetadataWithSignedUrl>()
  const handleOpenImageFullScreen = (image: ImageMetadataWithSignedUrl) => setImageFullScreen(image)
  const handleCloseImageFullScreen = () => setImageFullScreen(undefined)
  const handleContextMenu = (event: React.MouseEvent<HTMLImageElement>) => {
    event.preventDefault() // Prevent the default context menu
  }

  // Export form and handlers
  const [imageExploreOpen, setImageExploreOpen] = useState(false)
  const [imageToExplore, setImageToExplore] = useState<ImageMetadataI | undefined>()

  const handleImageExploreOpen = (image: ImageMetadataI) => {
    setImageToExplore(image)
    setImageExploreOpen(true)
  }
  const handleImageExploreClose = () => {
    setImageToExplore(undefined)
    setImageExploreOpen(false)
  }

  const imageListItems = useMemo(() => {
    return currentPageImages.map((doc: ImageMetadataWithSignedUrl) => (
      <ImageListItem key={doc.signedUrl} sx={{ width: '9vw', height: '9vw', overflow: 'hidden' }}>
        <>
          <Image
            key={doc.imageID}
            src={doc.signedUrl}
            placeholder="blur"
            blurDataURL={blurDataURL}
            loading="lazy"
            alt={'temp'}
            style={{
              width: '9vw',
              height: '9vw',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            width={150}
            height={150}
            quality={50}
            onContextMenu={handleContextMenu}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              '&:hover': {
                opacity: 1,
              },
              cursor: 'pointer',
            }}
            onClick={() => handleOpenImageFullScreen(doc)}
          >
            <Typography variant="body1" sx={{ textAlign: 'center' }}>
              Click to see full screen
            </Typography>
          </Box>
        </>
        <ImageListItemBar
          sx={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
          }}
          position="top"
          actionIcon={
            <CustomWhiteTooltip title="Metadata & Download" size="small">
              <IconButton onClick={() => handleImageExploreOpen(doc)} aria-label="Export image" sx={{ px: 0.5 }}>
                <Info
                  sx={{ ...CustomizedIconButton, color: 'white', fontSize: '1.3rem', '&:hover': { color: 'white' } }}
                />
              </IconButton>
            </CustomWhiteTooltip>
          }
        />
      </ImageListItem>
    ))
  }, [currentPageImages])

  return (
    <>
      <Box sx={{ maxHeight: '100vh', width: '100%', overflowY: 'scroll' }}>
        {isImagesLoading ? (
          <Skeleton variant="rounded" width={'100%'} height={500} sx={{ mt: 2, bgcolor: palette.primary.light }} />
        ) : (
          <>
            {currentPageImages !== undefined && currentPageImages.length !== 0 && (
              <>
                <ImageList cols={8} gap={8}>
                  {imageListItems}
                </ImageList>
                <Pagination
                  siblingCount={0}
                  boundaryCount={0}
                  count={fetchedImagesByPage.length}
                  page={page}
                  onChange={handleChangePage}
                  sx={{ pt: 2 }}
                />
              </>
            )}
          </>
        )}
      </Box>

      {imageFullScreen !== undefined && (
        <Modal
          open={imageFullScreen !== undefined}
          onClose={handleCloseImageFullScreen}
          sx={{ display: 'flex', alignContent: 'center', justifyContent: 'center', m: 5, cursor: 'pointer' }}
        >
          <Image
            key={'displayed-image'}
            src={imageFullScreen.signedUrl}
            alt={'displayed-image'}
            width={imageFullScreen.imageWidth}
            height={imageFullScreen.imageHeight}
            style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
            quality={100}
            onClick={() => handleCloseImageFullScreen()}
            onContextMenu={handleContextMenu}
          />
        </Modal>
      )}

      <ExploreDialog
        open={imageExploreOpen}
        documentToExplore={imageToExplore}
        handleImageExploreClose={handleImageExploreClose}
      />
    </>
  )
}
