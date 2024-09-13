import * as React from 'react'
import { useState } from 'react'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'

import { FileUpload } from '@mui/icons-material'

import Image from 'next/image'
import { Avatar, Box, IconButton, Modal, Skeleton, ImageListItem, ImageList, ImageListItemBar } from '@mui/material'

import { ImageI } from '../api/imagen-generate/generate-utils'
import { CustomizedAvatarButton, CustomizedIconButton } from './components/Button-SX'
import ExportStepper from './export-dialog'
import { ExportImageFormI } from '../api/imagen-generate/export-utils'

import theme from '../theme'
const { palette } = theme

export default function StandardImageList({
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
  const [imageExportOpen, setImageExportOpen] = useState(false)
  const {
    handleSubmit,
    resetField,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ExportImageFormI>({
    defaultValues: { upscaledFactor: 'x4' },
  })
  const handleImageExportOpen = (image: ImageI) => {
    setValue('imageToExport', image)
    setValue('upscaledFactor', image?.ratio === '1:1' ? 'x4' : '')
    setImageExportOpen(true)
  }
  const handleImageExportClose = () => {
    resetField('imageToExport')
    resetField('upscaledFactor')
    setImageExportOpen(false)
  }

  const handleImageExportSubmit: SubmitHandler<ExportImageFormI> = async (formData: ExportImageFormI) => {
    //onRequestSent(true)

    try {
      console.log(JSON.stringify(getValues(), undefined, 4))
      handleImageExportClose()
    } catch (error: any) {
      console.log(error)
      //onNewErrorMsg(error.toString())
    }
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
                    key={image.key}
                    src={image.src}
                    alt={image.altText}
                    style={{ width: '100%', height: 'auto' }}
                    width={image.width}
                    height={image.height}
                    quality={100}
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
        />
      </Modal>
      <form onSubmit={handleSubmit(handleImageExportSubmit)}>
        <ExportStepper
          open={imageExportOpen}
          control={control}
          setValue={setValue}
          formErrors={errors}
          onSubmit={handleImageExportSubmit}
          imageToExport={useWatch({ control, name: 'imageToExport' })}
          handleImageExportClose={handleImageExportClose}
        />
      </form>
    </>
  )
}
