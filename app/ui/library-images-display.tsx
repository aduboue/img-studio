'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'

import {
  Button,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Modal,
  Skeleton,
  Typography,
} from '@mui/material'

import theme from '../theme'
import { ImageMetadataI, ImageMetadataWithSignedUrl } from '@/app/api/export-utils'
import { blurDataURL } from '@/app/ui/components/blurImage'
import { ArrowBackIos, ArrowForwardIos, Info } from '@mui/icons-material'
import { CustomizedIconButton } from './components/Button-SX'
import ExploreDialog from './explore-dialog'
import { CustomWhiteTooltip } from './components/Tooltip'
const { palette } = theme

const CustomizedNavButtons = {
  '&:hover': { bgcolor: 'transparent', fontWeight: 700 },
  fontSize: '1.1rem',
  fontWeight: 500,
  '&.Mui-disabled': { fontWeight: 500, fontSize: '1.05rem' },
}

export default function LibraryImagesDisplay({
  isImagesLoading,
  fetchedImagesByPage,
  handleLoadMore,
  isMorePageToLoad,
}: {
  isImagesLoading: boolean
  fetchedImagesByPage: ImageMetadataWithSignedUrl[][]
  handleLoadMore: () => void
  isMorePageToLoad: boolean
}) {
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(0)
  const [currentPageImages, setCurrentPageImages] = useState<ImageMetadataWithSignedUrl[]>([])

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  useEffect(() => {
    if (fetchedImagesByPage[page - 1]) setCurrentPageImages(fetchedImagesByPage[page - 1])
    else if (page > fetchedImagesByPage.length && isMorePageToLoad) handleLoadMore()

    const calculatedMaxPage = isMorePageToLoad ? fetchedImagesByPage.length + 1 : fetchedImagesByPage.length
    setMaxPage(calculatedMaxPage)
  }, [page, fetchedImagesByPage])

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
      <ImageListItem
        key={doc.signedUrl}
        sx={{
          width: '9vw',
          height: '9vw',
          overflow: 'hidden',
          boxShadow: '0px 5px 10px -1px rgb(0 0 0 / 70%)',
          transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        }}
      >
        <React.Fragment key={doc.imageID}>
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
        </React.Fragment>
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
                <ImageList cols={8} gap={8} sx={{ cursor: 'pointer', '&.MuiImageList-root': { pb: 5, px: 1 } }}>
                  {imageListItems}
                </ImageList>
                <Button
                  onClick={() => handleChangePage(page - 1)}
                  disabled={page === 1}
                  startIcon={<ArrowBackIos sx={{ '&.MuiSvgIcon-root': { fontSize: '0.95rem' } }} />}
                  sx={CustomizedNavButtons}
                >
                  Prev.
                </Button>
                <Button
                  onClick={() => handleChangePage(page + 1)}
                  disabled={maxPage === page && maxPage !== 0}
                  endIcon={<ArrowForwardIos sx={{ '&.MuiSvgIcon-root': { fontSize: '0.95rem' } }} />}
                  sx={CustomizedNavButtons}
                >
                  Next
                </Button>
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
