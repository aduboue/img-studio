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

import * as React from 'react'
import { useEffect, useState } from 'react'

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { Check, Close, Replay } from '@mui/icons-material'

import theme from '../../theme'
import ImageDropzone from './ImageDropzone'
import { set } from 'react-hook-form'
import { getPromptFromImageFromGemini } from '@/app/api/gemini/action'
import { CustomizedSendButton } from '../ux-components/Button-SX'
const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function ImageToPromptModal({
  open,
  setNewPrompt,
  setImageToPromptOpen,
  target,
}: {
  open: boolean
  setNewPrompt: (newPormpt: string) => void
  setImageToPromptOpen: (state: boolean) => void
  target: 'Image' | 'Video'
}) {
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (image !== '' && image !== null && prompt === '') {
      getPromptFromImage()
    }
  }, [image])

  const getPromptFromImage = async () => {
    setIsGeneratingPrompt(true)
    try {
      const geminiReturnedPrompt = await getPromptFromImageFromGemini(image as string, target)

      if (!(typeof geminiReturnedPrompt === 'object' && 'error' in geminiReturnedPrompt))
        setPrompt(geminiReturnedPrompt as string)
    } catch (error) {
      console.error(error)
      error && setErrorMsg(error.toString())
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const onValidate = () => {
    if (prompt) setNewPrompt(prompt)
    onClose()
  }

  const onReset = () => {
    setErrorMsg('')
    setIsGeneratingPrompt(false)
    setImage(null)
    setPrompt('')
  }

  const onClose = () => {
    setImageToPromptOpen(false)
    onReset()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-describedby="parameter the export of an image"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'left',
          p: 1,
          cursor: 'pointer',
          height: '63%',
          maxWidth: '70%',
          width: '60%',
          borderRadius: 1,
          background: 'white',
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
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
            {'Image-to-prompt generator'}
          </Typography>
        </DialogTitle>
        <Stack
          direction="row"
          spacing={2.5}
          justifyContent="flex-start"
          alignItems="flex-start"
          sx={{ pt: 2, px: 1, width: '100%' }}
        >
          <ImageDropzone
            setImage={(base64Image: string) => setImage(base64Image)}
            image={image}
            onNewErrorMsg={setErrorMsg}
            size={{ width: '110vw', height: '110vw' }}
            maxSize={{ width: 280, height: 280 }}
            object={'contain'}
          />
          <Stack
            direction="column"
            spacing={2.5}
            justifyContent="flex-end"
            alignItems="flex-end"
            sx={{ width: '100%' }}
          >
            <Box sx={{ position: 'relative', width: '100%' }}>
              {isGeneratingPrompt && (
                <CircularProgress
                  size={30}
                  thickness={6}
                  color="primary"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    zIndex: 1,
                  }}
                />
              )}
              <TextField
                label="Generated prompt"
                disabled={!(image !== null && image !== '' && !isGeneratingPrompt)}
                error={errorMsg !== ''}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                multiline
                rows={11}
                defaultValue="Upload image first"
                sx={{ width: '98%' }}
              />
            </Box>
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="flex-end">
              <Button
                onClick={() => onReset()}
                variant="contained"
                disabled={!(image !== null && image !== '' && !isGeneratingPrompt && prompt !== '')}
                endIcon={<Replay />}
                sx={CustomizedSendButton}
              >
                {'Reset'}
              </Button>
              <Button
                onClick={() => onValidate()}
                variant="contained"
                disabled={!(image !== null && image !== '' && !isGeneratingPrompt && prompt !== '')}
                endIcon={<Check />}
                sx={CustomizedSendButton}
              >
                {'Use prompt'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
