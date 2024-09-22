import * as React from 'react'
import { useState } from 'react'

import { FileUpload } from '@mui/icons-material'

import Image from 'next/image'
import { Avatar, Box, IconButton, Modal, Skeleton, ImageListItem, ImageList, ImageListItemBar } from '@mui/material'

import { ImageI } from '../api/generate-utils'
import { CustomizedAvatarButton, CustomizedIconButton } from './components/Button-SX'
import ExportStepper from './export-dialog'

import theme from '../theme'
import { blurDataURL } from './components/blurImage'
const { palette } = theme

export default function OutputImagesDisplay({
  isLoading,
  generatedImagesInGCS,
}: {
  isLoading: boolean
  generatedImagesInGCS: ImageI[]
}) {
  // Full screen image display
  const [imageFullScreenSrc, setImageFullScreenSrc] = useState('')
  const handleOpenImageFullScreen = (src: string) => setImageFullScreenSrc(src)
  const handleCloseImageFullScreen = () => setImageFullScreenSrc('')
  const handleContextMenu = (event: React.MouseEvent<HTMLImageElement>) => {
    event.preventDefault() // Prevent the default context menu
  }

  // Export form and handlers
  // Form state values are set here and not in export-dialog component, so that user don't have to set metadata for each image if they don't change
  const [imageExportOpen, setImageExportOpen] = useState(false)
  const [imageToExport, setImageToExport] = useState<ImageI | undefined>()

  const handleImageExportOpen = (image: ImageI) => {
    setImageToExport(image)
    setImageExportOpen(true)
  }
  const handleImageExportClose = () => {
    setImageToExport(undefined)
    setImageExportOpen(false)
  }

  return (
    <>
      <Box sx={{ height: '79vh', maxHeight: 650, overflowY: 'scroll', width: '90%' }}>
        {isLoading ? ( // Conditional rendering based on loading state
          <Skeleton variant="rounded" width={450} height={450} sx={{ mt: 2, bgcolor: palette.primary.light }} />
        ) : (
          <ImageList cols={2} gap={8} sx={{ cursor: 'pointer', '&.MuiImageList-root': { pb: 5, px: 1 } }}>
            {generatedImagesInGCS.map((image) =>
              image.src ? (
                <ImageListItem
                  key={image.key}
                  sx={{
                    boxShadow: '0px 5px 10px -1px rgb(0 0 0 / 70%)',
                    transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                  }}
                >
                  <Image
                    key={image.src}
                    src={image.src}
                    alt={image.altText}
                    style={{ width: '100%', height: 'auto' }}
                    width={image.width}
                    height={image.height}
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                    loading="lazy"
                    quality={80}
                    onClick={() => handleOpenImageFullScreen(image.src)}
                    onContextMenu={handleContextMenu}
                  />
                  <ImageListItemBar
                    sx={{
                      background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                    }}
                    position="top"
                    actionIcon={
                      <IconButton
                        onClick={() => handleImageExportOpen(image)}
                        aria-label="Export image"
                        sx={{ px: 0.5 }}
                      >
                        <Avatar sx={CustomizedAvatarButton}>
                          <FileUpload sx={CustomizedIconButton} />
                        </Avatar>
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ) : null
            )}
          </ImageList>
        )}
      </Box>

      <Modal
        open={imageFullScreenSrc !== ''}
        onClose={handleCloseImageFullScreen}
        sx={{ display: 'flex', m: 5, cursor: 'pointer' }}
      >
        <Image
          key={'displayed-image'}
          src={imageFullScreenSrc}
          alt={'displayed-image'}
          sizes="300px"
          fill
          style={{
            objectFit: 'contain',
          }}
          quality={100}
          onClick={() => handleCloseImageFullScreen()}
          onContextMenu={handleContextMenu}
          loading="lazy"
        />
      </Modal>

      <ExportStepper
        open={imageExportOpen}
        imageToExport={imageToExport}
        handleImageExportClose={handleImageExportClose}
      />
    </>
  )
}
