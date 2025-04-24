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

import theme from '../../theme'
import { MediaMetadataI, MediaMetadataWithSignedUrl } from '@/app/api/export-utils'
import { blurDataURL } from '@/app/ui/ux-components/BlurImage'
import { ArrowBackIos, ArrowForwardIos, Info, PlayArrowRounded } from '@mui/icons-material'
import { CustomizedIconButton } from '../ux-components/Button-SX'
import ExploreDialog from './ExploreDialog'
import { CustomWhiteTooltip } from '../ux-components/Tooltip'
import { VideoI } from '@/app/api/generate-video-utils'
const { palette } = theme

const CustomizedNavButtons = {
  '&:hover': { bgcolor: 'transparent', fontWeight: 700 },
  fontSize: '1.1rem',
  fontWeight: 500,
  '&.Mui-disabled': { fontWeight: 500, fontSize: '1.05rem' },
}

export default function LibraryMediasDisplay({
  isMediasLoading,
  fetchedMediasByPage,
  handleLoadMore,
  isMorePageToLoad,
}: {
  isMediasLoading: boolean
  fetchedMediasByPage: MediaMetadataWithSignedUrl[][]
  handleLoadMore: () => void
  isMorePageToLoad: boolean
}) {
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(0)
  const [currentPageImages, setCurrentPageImages] = useState<MediaMetadataWithSignedUrl[]>([])

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  useEffect(() => {
    if (fetchedMediasByPage[page - 1]) setCurrentPageImages(fetchedMediasByPage[page - 1])
    else if (page > fetchedMediasByPage.length && isMorePageToLoad) handleLoadMore()

    const calculatedMaxPage = isMorePageToLoad ? fetchedMediasByPage.length + 1 : fetchedMediasByPage.length
    setMaxPage(calculatedMaxPage)
  }, [page, fetchedMediasByPage])

  // Full screen media display
  const [mediaFullScreen, setMediaFullScreen] = useState<MediaMetadataWithSignedUrl>()
  const handleOpenMediaFullScreen = (media: MediaMetadataWithSignedUrl) => setMediaFullScreen(media)
  const handleCloseMediaFullScreen = () => setMediaFullScreen(undefined)

  const handleContextMenu = (event: React.MouseEvent<HTMLImageElement> | React.MouseEvent<HTMLVideoElement>) => {
    event.preventDefault()
  }

  // Explore handlers
  const [mediaExploreOpen, setMediaExploreOpen] = useState(false)
  const [mediaToExplore, setImageToExplore] = useState<MediaMetadataI | undefined>()
  const handleMediaExploreOpen = (media: MediaMetadataI) => {
    setImageToExplore(media)
    setMediaExploreOpen(true)
  }
  const handleMediaExploreClose = () => {
    setImageToExplore(undefined)
    setMediaExploreOpen(false)
  }

  function ImageDisplay({ doc }: { doc: MediaMetadataWithSignedUrl }) {
    return (
      <>
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
          onClick={() => handleOpenMediaFullScreen(doc)}
        >
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Click to see full screen
          </Typography>
        </Box>
      </>
    )
  }

  function VideoDisplay({ doc }: { doc: MediaMetadataWithSignedUrl }) {
    return (
      <>
        <PlayArrowRounded
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '4rem',
            color: 'rgba(255, 255, 255, 0.89)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
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
          }}
          onClick={() => handleOpenMediaFullScreen(doc)}
        />
      </>
    )
  }

  const mediaListItems = useMemo(() => {
    return currentPageImages.map((doc: MediaMetadataWithSignedUrl) => (
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
        <Image
          key={doc.id}
          src={doc.format === 'MP4' ? (doc.videoThumbnailSignedUrl as string) : doc.signedUrl}
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
          onClick={() => handleOpenMediaFullScreen(doc)}
        >
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Click to see full screen
          </Typography>
        </Box>
        {doc.format === 'MP4' ? <VideoDisplay doc={doc} /> : <ImageDisplay doc={doc} />}
        <ImageListItemBar
          sx={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
          }}
          position="top"
          actionIcon={
            <CustomWhiteTooltip title="Metadata & Download" size="small">
              <IconButton onClick={() => handleMediaExploreOpen(doc)} aria-label="Explore media" sx={{ px: 0.5 }}>
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
        {isMediasLoading ? (
          <Skeleton variant="rounded" width={'100%'} height={500} sx={{ mt: 2, bgcolor: palette.primary.light }} />
        ) : (
          <>
            {currentPageImages !== undefined && currentPageImages.length !== 0 && (
              <>
                <ImageList cols={8} gap={8} sx={{ cursor: 'pointer', '&.MuiImageList-root': { pb: 5, px: 1 } }}>
                  {mediaListItems}
                </ImageList>
                <Button
                  onClick={() => handleChangePage(page - 1)}
                  disabled={page === 1}
                  startIcon={<ArrowBackIos sx={{ '&.MuiSvgIcon-root': { fontSize: '0.95rem' } }} />}
                  sx={CustomizedNavButtons}
                >
                  {'Prev.'}
                </Button>
                <Button
                  onClick={() => handleChangePage(page + 1)}
                  disabled={maxPage === page && maxPage !== 0}
                  endIcon={<ArrowForwardIos sx={{ '&.MuiSvgIcon-root': { fontSize: '0.95rem' } }} />}
                  sx={CustomizedNavButtons}
                >
                  {'Next'}
                </Button>
              </>
            )}
          </>
        )}
      </Box>

      {mediaFullScreen !== undefined && mediaFullScreen.format !== 'MP4' && (
        <Modal
          open={mediaFullScreen !== undefined}
          onClose={handleCloseMediaFullScreen}
          sx={{
            display: 'flex',
            alignContent: 'center',
            justifyContent: 'center',
            m: 5,
            cursor: 'pointer',
            maxHeight: '90vh',
            maxWidth: '90vw',
          }}
          disableAutoFocus={true}
        >
          <Image
            key={'displayed-image'}
            src={mediaFullScreen.signedUrl}
            alt={'displayed-image'}
            width={mediaFullScreen.width}
            height={mediaFullScreen.height}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            quality={100}
            onClick={() => handleCloseMediaFullScreen()}
            onContextMenu={handleContextMenu}
          />
        </Modal>
      )}

      {mediaFullScreen !== undefined && mediaFullScreen.format === 'MP4' && (
        <Modal
          open={mediaFullScreen !== undefined}
          onClose={handleCloseMediaFullScreen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleCloseMediaFullScreen}
          disableAutoFocus={true}
        >
          <Box
            sx={{
              aspectRatio: `${mediaFullScreen.aspectRatio.replace(':', '/')}`,
              maxWidth: '65vw',
              maxHeight: '65vh',
              bgcolor: 'black',
              display: 'flex',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              key={'displayed-video'}
              src={mediaFullScreen.signedUrl}
              controls
              controlsList="nodownload noplaybackrate nopictureinpicture"
              autoPlay
              preload="metadata"
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                outline: 'none',
                objectFit: 'contain',
              }}
              onContextMenu={handleContextMenu}
            />
          </Box>
        </Modal>
      )}

      <ExploreDialog
        open={mediaExploreOpen}
        documentToExplore={mediaToExplore}
        handleMediaExploreClose={handleMediaExploreClose}
      />
    </>
  )
}
