import * as React from 'react'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import ImageListItemBar from '@mui/material/ImageListItemBar'
import { AddPhotoAlternate } from '@mui/icons-material'
import { ImageI } from '../api/imagen-generate/generate-definitions'

import Image from 'next/image'
import { Box, IconButton, Modal, Skeleton } from '@mui/material'

import theme from 'app/theme'
const palette = theme.palette

export default function StandardImageList({
  isLoading,
  generatedImagesInGCS,
}: {
  isLoading: boolean
  generatedImagesInGCS: ImageI[]
}) {
  const [imageFullScreenSrc, setImageFullScreenSrc] = React.useState('')
  const handleOpen = (src: string) => setImageFullScreenSrc(src)
  const handleClose = () => setImageFullScreenSrc('')
  const handleContextMenu = (event: React.MouseEvent<HTMLImageElement>) => {
    event.preventDefault() // Prevent the default context menu
  }

  return (
    <>
      <Box sx={{ height: '79vh', overflowY: 'scroll', width: '90%' }}>
        {isLoading ? ( // Conditional rendering based on loading state
          <Skeleton variant="rounded" width={450} height={450} sx={{ mt: 2, bgcolor: palette.primary.light }} />
        ) : (
          <ImageList cols={2} gap={8} sx={{ cursor: 'pointer', '&.MuiImageList-root': { pb: 5, px: 1 } }}>
            {generatedImagesInGCS.map((image) => (
              <ImageListItem
                key={image.key}
                sx={{
                  boxShadow: '0px 5px 10px -1px rgb(0 0 0 / 70%)',
                  transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                }}
              >
                <Image
                  key={image.key}
                  src={image.src}
                  alt={image.altText}
                  layout="responsive"
                  width={image.width}
                  height={image.height}
                  quality={100}
                  onClick={() => handleOpen(image.src)}
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
                      sx={{ color: 'white' }}
                      aria-label={`export image ${image.altText}`}
                      onClick={() => {
                        console.log('clicked')
                      }}
                    >
                      <AddPhotoAlternate sx={{ fontSize: 25 }} />
                    </IconButton>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </Box>

      <Modal open={imageFullScreenSrc !== ''} onClose={handleClose} sx={{ display: 'flex', m: 5, cursor: 'pointer' }}>
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
          onClick={() => handleClose()}
          onContextMenu={handleContextMenu}
        />
      </Modal>
    </>
  )
}
