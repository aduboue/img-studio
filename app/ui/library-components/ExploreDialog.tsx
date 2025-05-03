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
import { useState } from 'react'

import { Dialog, DialogContent, DialogTitle, IconButton, Slide, Box, Button, Typography, Stack } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { ArrowRight, AutoAwesome, Close, Download, Edit } from '@mui/icons-material'
import { useAppContext, appContextDataDefault } from '../../context/app-context'

import theme from '../../theme'
import { MediaMetadataI } from '../../api/export-utils'
import { CustomizedSendButton } from '../ux-components/Button-SX'
import { downloadMediaFromGcs } from '../../api/cloud-storage/action'
import { useRouter } from 'next/navigation'
import { downloadBase64Media } from '../transverse-components/ExportDialog'
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
  handleMediaExploreClose,
}: {
  open: boolean
  documentToExplore: MediaMetadataI | undefined
  handleMediaExploreClose: () => void
}) {
  const [downloadStatus, setDownloadStatus] = useState('Download')

  const { setAppContext } = useAppContext()
  const router = useRouter()

  const handleEditClick = (uri: string) => {
    setAppContext((prevContext) => {
      if (prevContext) return { ...prevContext, imageToEdit: uri }
      else return { ...appContextDataDefault, imageToEdit: uri }
    })
    router.push('/edit')
  }

  const handleRegenerateClick = (prompt: string, format: string) => {
    if (format === 'MP4') {
      setAppContext((prevContext) => {
        if (prevContext) return { ...prevContext, promptToGenerateVideo: prompt, promptToGenerateImage: '' }
        else return { ...appContextDataDefault, promptToGenerateVideo: prompt, promptToGenerateImage: '' }
      })
    } else {
      setAppContext((prevContext) => {
        if (prevContext) return { ...prevContext, promptToGenerateImage: prompt, promptToGenerateVideo: '' }
        else return { ...appContextDataDefault, promptToGenerateImage: prompt, promptToGenerateVideo: '' }
      })
    }

    router.push('/generate')
  }

  const handleDownload = async (documentToExplore: MediaMetadataI) => {
    try {
      setDownloadStatus('Preparing download...')
      const res = await downloadMediaFromGcs(documentToExplore.gcsURI)
      const mediaName = `${documentToExplore.id}.${documentToExplore.format.toLowerCase()}`
      downloadBase64Media(res.data, mediaName, documentToExplore.format)

      if (typeof res === 'object' && res['error']) {
        throw Error(res['error'].replaceAll('Error: ', ''))
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setDownloadStatus('Download')
    }
  }

  const { appContext } = useAppContext()
  const exportMetaOptions = appContext ? appContext.exportMetaOptions : appContextDataDefault.exportMetaOptions

  if (exportMetaOptions)
    return (
      <Dialog
        open={open}
        onClose={handleMediaExploreClose}
        aria-describedby="explore media metadata"
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
          onClick={handleMediaExploreClose}
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
              {'Explore media metadata'}
            </Typography>
          </DialogTitle>
          <Box sx={{ pt: 1, pb: 2, width: '90%' }}>
            {documentToExplore &&
              Object.entries(exportMetaOptions).map(([key, fieldConfig]) => {
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
                    onClick={() =>
                      handleRegenerateClick(documentToExplore ? documentToExplore.prompt : '', documentToExplore.format)
                    }
                    endIcon={<AutoAwesome sx={{ mr: 0.4 }} />}
                    sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
                  >
                    {'Replay prompt'}
                  </Button>
                </Box>
                {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && documentToExplore.format !== 'MP4' && (
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                      variant="contained"
                      onClick={() => handleEditClick(documentToExplore ? documentToExplore.gcsURI : '')}
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
