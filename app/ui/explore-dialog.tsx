'use client'

import * as React from 'react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogTitle, IconButton, Slide, Box, Button, Typography, Stack } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { ArrowRight, AutoAwesome, Close, Download, Edit } from '@mui/icons-material'
import { useAppContext, appContextDataDefault } from '../context/app-context'

import theme from '../theme'
import { ImageMetadataI } from '../api/export-utils'
import { CustomizedSendButton } from './components/Button-SX'
import { downloadImage } from '../api/cloud-storage/action'
import { useRouter } from 'next/navigation'
const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function ExploreDialog({
  open,
  documentToExplore,
  handleImageExploreClose,
}: {
  open: boolean
  documentToExplore: ImageMetadataI | undefined
  handleImageExploreClose: () => void
}) {
  const [downloadStatus, setDownloadStatus] = useState('Download')

  const { setAppContext } = useAppContext()
  const router = useRouter()

  const handleEditClick = (imageGcsURI: string) => {
    setAppContext((prevContext) => {
      if (prevContext) return { ...prevContext, imageToEdit: imageGcsURI }
      else return { ...appContextDataDefault, imageToEdit: imageGcsURI }
    })
    router.push('/edit')
  }

  const handleRegenerateClick = (prompt: string) => {
    setAppContext((prevContext) => {
      if (prevContext) return { ...prevContext, promptToGenerate: prompt }
      else return { ...appContextDataDefault, promptToGenerate: prompt }
    })
    router.push('/generate')
  }

  const handleDownload = async (documentToExplore: ImageMetadataI) => {
    try {
      setDownloadStatus('Preparing download...')
      const res = await downloadImage(documentToExplore.imageGcsURI)
      const imageName = `${documentToExplore.imageID}.${documentToExplore.imageFormat.toLowerCase()}`
      downloadBase64Image(res.image, imageName)

      if (typeof res === 'object' && res['error']) {
        throw Error(res['error'].replaceAll('Error: ', ''))
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setDownloadStatus('Download')
    }
  }

  const downloadBase64Image = (base64Data: any, filename: string) => {
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${base64Data}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { appContext } = useAppContext()
  const ExportImageFormFields = appContext ? appContext.exportFields : appContextDataDefault.exportFields

  if (ExportImageFormFields)
    return (
      <Dialog
        open={open}
        onClose={handleImageExploreClose}
        aria-describedby="parameter the export of an image"
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'left',
            p: 1,
            cursor: 'pointer',
            height: '90%',
            maxWidth: '70%',
            width: '40%',
            borderRadius: 1,
            background: 'white',
          },
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleImageExploreClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: palette.secondary.dark,
          }}
        >
          <Close sx={{ fontSize: '1.5rem', '&:hover': { color: palette.primary.main } }} />
        </IconButton>
        <DialogContent sx={{ m: 1 }}>
          <DialogTitle sx={{ p: 0, pb: 3 }}>
            <Typography
              sx={{
                fontSize: '1.7rem',
                color: palette.text.primary,
                fontWeight: 400,
                display: 'flex',
                alignContent: 'center',
              }}
            >
              {'Explore image metadata'}
            </Typography>
          </DialogTitle>
          <Box sx={{ pt: 1, pb: 2, width: '90%' }}>
            {documentToExplore &&
              Object.entries(ExportImageFormFields).map(([key, fieldConfig]) => {
                const value = documentToExplore[key]
                let displayValue = value ? `${value}` : null

                if (displayValue && typeof value === 'object') {
                  displayValue = Object.keys(value)
                    .filter((val) => value[val])
                    .map((val) => {
                      const matchingOption = fieldConfig.options?.find(
                        (option: { value: string }) => option.value === val
                      )
                      return matchingOption ? matchingOption.label : val
                    })
                    .join(', ')
                }

                const displayLabel = fieldConfig.name || fieldConfig.label

                if (displayValue && displayValue !== '' && fieldConfig.isExploreVisible) {
                  return (
                    <Box key={key} display="flex" flexDirection="row">
                      <ArrowRight sx={{ color: palette.primary.main, fontSize: '1.2rem', p: 0, mt: 0.2 }} />
                      <Box sx={{ pb: 1 }}>
                        <Typography display="inline" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                          {`${displayLabel}: `}
                        </Typography>
                        <Typography display="inline" sx={{ fontSize: '0.9rem', color: palette.text.secondary }}>
                          {displayValue}
                        </Typography>
                      </Box>
                    </Box>
                  )
                } else {
                  return null
                }
              })}
          </Box>
          <Stack direction="row" gap={0} pb={3}>
            {documentToExplore && (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    onClick={() => handleDownload(documentToExplore)}
                    endIcon={<Download sx={{ mr: 0.2 }} />}
                    disabled={downloadStatus === 'Preparing download...'}
                    sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
                  >
                    {downloadStatus}
                  </Button>
                </Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="contained"
                    onClick={() => handleRegenerateClick(documentToExplore ? documentToExplore.imagePrompt : '')}
                    endIcon={<AutoAwesome sx={{ mr: 0.4 }} />}
                    sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
                  >
                    {'Replay prompt'}
                  </Button>
                </Box>
                {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && (
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                      variant="contained"
                      onClick={() => handleEditClick(documentToExplore ? documentToExplore.imageGcsURI : '')}
                      endIcon={<Edit />}
                      sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
                    >
                      {'Edit'}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    )
}
