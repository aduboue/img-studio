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

import { AutoAwesome, CreateNewFolderRounded, Download, Edit, Favorite, VideocamRounded } from '@mui/icons-material'

import Image from 'next/image'
import {
  Avatar,
  Box,
  IconButton,
  Modal,
  Skeleton,
  ImageListItem,
  ImageList,
  ImageListItemBar,
  Typography,
  Stack,
} from '@mui/material'

import { ImageI } from '../../api/generate-image-utils'
import { CustomizedAvatarButton, CustomizedIconButton } from '../ux-components/Button-SX'
import ExportStepper from './ExportDialog'
import DownloadDialog from './DownloadDialog'

import theme from '../../theme'
import { blurDataURL } from '../ux-components/BlurImage'
import { CustomWhiteTooltip } from '../ux-components/Tooltip'
import { appContextDataDefault, useAppContext } from '../../context/app-context'
import { useRouter } from 'next/navigation'
const { palette } = theme

export default function OutputImagesDisplay({
  isLoading,
  generatedImagesInGCS,
  generatedCount,
  isPromptReplayAvailable,
}: {
  isLoading: boolean
  generatedImagesInGCS: ImageI[]
  generatedCount: number
  isPromptReplayAvailable: boolean
}) {
  // Full screen, Export & Download states
  const [imageFullScreen, setImageFullScreen] = useState<ImageI | undefined>()
  const [imageToExport, setImageToExport] = useState<ImageI | undefined>()
  const [imageToDL, setImageToDL] = useState<ImageI | undefined>()

  const { setAppContext } = useAppContext()
  const router = useRouter()

  const handleMoreLikeThisClick = (prompt: string) => {
    setAppContext((prevContext) => {
      if (prevContext) return { ...prevContext, promptToGenerateImage: prompt, promptToGenerateVideo: '' }
      else return { ...appContextDataDefault, promptToGenerateImage: prompt, promptToGenerateVideo: '' }
    })
  }
  const handleEditClick = (imageGcsURI: string) => {
    setAppContext((prevContext) => {
      if (prevContext) return { ...prevContext, imageToEdit: imageGcsURI }
      else return { ...appContextDataDefault, imageToEdit: imageGcsURI }
    })
    router.push('/edit')
  }
  const handleITVClick = (imageGcsURI: string) => {
    setAppContext((prevContext) => {
      if (prevContext) return { ...prevContext, imageToVideo: imageGcsURI }
      else return { ...appContextDataDefault, imageToVideo: imageGcsURI }
    })
    router.push('/generate')
  }

  return (
    <>
      <Box sx={{ height: '79vh', maxHeight: 650, width: '90%' }}>
        {isLoading ? (
          <Skeleton variant="rounded" width={450} height={450} sx={{ mt: 2, bgcolor: palette.primary.light }} />
        ) : (
          <ImageList
            cols={generatedCount > 1 ? 2 : 1}
            gap={8}
            sx={{ cursor: 'pointer', '&.MuiImageList-root': { pb: 5, px: 1 } }}
          >
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
                    onContextMenu={(event: React.MouseEvent<HTMLImageElement>) => {
                      event.preventDefault()
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
                    onClick={() => setImageFullScreen(image)}
                  >
                    <Typography variant="body1" sx={{ textAlign: 'center' }}>
                      Click to see full screen
                    </Typography>
                  </Box>
                  <ImageListItemBar
                    sx={{
                      height: 10,
                      display: 'flex',
                      backgroundColor: 'transparent',
                      flexWrap: 'wrap',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        border: 0,
                        boxShadow: 0,
                      },
                    }}
                    position="top"
                    actionIcon={
                      <Stack direction="row" gap={0} pb={3}>
                        {
                          //  If there is a replayable prompt, display the "More like this" button
                          isPromptReplayAvailable && !image.prompt.includes('[1]') && (
                            <CustomWhiteTooltip title="More like this!" size="small">
                              <IconButton
                                onClick={() => handleMoreLikeThisClick(image.prompt)}
                                aria-label="More like this!"
                                sx={{ pr: 0.2, zIndex: 10 }}
                                disableRipple
                              >
                                <Avatar sx={CustomizedAvatarButton}>
                                  <Favorite sx={CustomizedIconButton} />
                                </Avatar>
                              </IconButton>
                            </CustomWhiteTooltip>
                          )
                        }
                        {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && (
                          <CustomWhiteTooltip title="Edit this image" size="small">
                            <IconButton
                              onClick={() => handleEditClick(image.gcsUri)}
                              aria-label="Edit image"
                              sx={{ px: 0.2, zIndex: 10 }}
                              disableRipple
                            >
                              <Avatar sx={CustomizedAvatarButton}>
                                <Edit sx={CustomizedIconButton} />
                              </Avatar>
                            </IconButton>
                          </CustomWhiteTooltip>
                        )}
                        {process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' &&
                          process.env.NEXT_PUBLIC_VEO_ITV_ENABLED === 'true' && (
                            <CustomWhiteTooltip title="Image to video" size="small">
                              <IconButton
                                onClick={() => handleITVClick(image.gcsUri)}
                                aria-label="Image to video"
                                sx={{ px: 0.2, zIndex: 10 }}
                                disableRipple
                              >
                                <Avatar sx={CustomizedAvatarButton}>
                                  <VideocamRounded sx={CustomizedIconButton} />
                                </Avatar>
                              </IconButton>
                            </CustomWhiteTooltip>
                          )}
                        <CustomWhiteTooltip title="Export to library" size="small">
                          <IconButton
                            onClick={() => setImageToExport(image)}
                            aria-label="Export image"
                            sx={{ px: 0.2, zIndex: 10 }}
                            disableRipple
                          >
                            <Avatar sx={CustomizedAvatarButton}>
                              <CreateNewFolderRounded sx={CustomizedIconButton} />
                            </Avatar>
                          </IconButton>
                        </CustomWhiteTooltip>
                        <CustomWhiteTooltip title="Download locally" size="small">
                          <IconButton
                            onClick={() => setImageToDL(image)}
                            aria-label="Download image"
                            sx={{ pr: 1, pl: 0.2, zIndex: 10 }}
                            disableRipple
                          >
                            <Avatar sx={CustomizedAvatarButton}>
                              <Download sx={CustomizedIconButton} />
                            </Avatar>
                          </IconButton>
                        </CustomWhiteTooltip>
                      </Stack>
                    }
                  />
                </ImageListItem>
              ) : null
            )}
          </ImageList>
        )}
      </Box>
      {imageFullScreen !== undefined && (
        <Modal
          open={imageFullScreen !== undefined}
          onClose={() => setImageFullScreen(undefined)}
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
            src={imageFullScreen.src}
            alt={'displayed-image'}
            width={imageFullScreen.width}
            height={imageFullScreen.height}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            quality={100}
            onClick={() => setImageFullScreen(undefined)}
            onContextMenu={(event: React.MouseEvent<HTMLImageElement>) => {
              event.preventDefault()
            }}
          />
        </Modal>
      )}
      <ExportStepper
        open={imageToExport !== undefined}
        upscaleAvailable={true}
        mediaToExport={imageToExport}
        handleMediaExportClose={() => setImageToExport(undefined)}
      />
      <DownloadDialog
        open={imageToDL !== undefined}
        mediaToDL={imageToDL}
        handleMediaDLClose={() => setImageToDL(undefined)}
      />
    </>
  )
}
