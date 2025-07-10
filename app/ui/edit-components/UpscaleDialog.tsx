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

import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  RadioGroup,
  Slide,
  Box,
  Button,
  Typography,
  FormControlLabel,
  FormControl,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { CustomizedSendButton } from '../ux-components/Button-SX'
import { Cancel, Close, Send } from '@mui/icons-material'
import { CustomRadioButton, CustomRadioLabel } from '../ux-components/InputRadioButton'

import theme from '../../theme'
import { EditImageFormI } from '@/app/api/edit-utils'

const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function UpscaleDialog({
  open,
  imageSize,
  closeUpscaleDialog,
  upscaleFactor,
  setUpscaleFactor,
  onUpscaleSubmit,
}: {
  open: boolean
  imageSize: { width: number; height: number; ratio: string }
  closeUpscaleDialog: () => void
  upscaleFactor: string
  setUpscaleFactor: React.Dispatch<React.SetStateAction<string>>
  onUpscaleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpscaleFactor((event.target as HTMLInputElement).value)
  }

  const isTooLarge = (width: number, height: number) => width > 5000 || height > 5000

  return (
    <Dialog
      open={open}
      onClose={closeUpscaleDialog}
      aria-describedby="parameter the upscale of the media"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          p: 1,
          cursor: 'pointer',
          borderRadius: 1,
          background: 'white',
          maxWidth: '350px',
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={closeUpscaleDialog}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: palette.secondary.dark,
        }}
      >
        <Close sx={{ fontSize: '1.5rem', '&:hover': { color: palette.primary.main } }} />
      </IconButton>
      <DialogContent sx={{ m: 0 }}>
        <DialogTitle sx={{ p: 0, pb: 1 }}>
          <Typography
            sx={{
              fontSize: '1.7rem',
              color: palette.text.primary,
              fontWeight: 400,
              display: 'flex',
              alignContent: 'center',
            }}
          >
            {'Upscale image'}
          </Typography>
        </DialogTitle>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 0, width: '90%' }}>
          {'Select target resolution for your image.'}
        </Typography>
        <FormControl>
          <RadioGroup value={upscaleFactor} onChange={handleChange} sx={{ p: 2, pl: 0.5 }}>
            <FormControlLabel
              value="x2"
              control={<CustomRadioButton />}
              label={CustomRadioLabel(
                'x2',
                'Scale x2',
                imageSize && isTooLarge(imageSize.width * 2, imageSize.height * 2)
                  ? 'Unavailable, image too large'
                  : imageSize
                  ? `${imageSize.width * 2} x ${imageSize.height * 2} px`
                  : '',
                upscaleFactor,
                true
              )}
              disabled={imageSize && isTooLarge(imageSize.width * 2, imageSize.height * 2)}
            />
            <FormControlLabel
              value="x4"
              control={<CustomRadioButton />}
              label={CustomRadioLabel(
                'x4',
                'Scale x4',
                imageSize && isTooLarge(imageSize.width * 4, imageSize.height * 4)
                  ? 'Unavailable, image too large'
                  : imageSize
                  ? `${imageSize.width * 4} x ${imageSize.height * 4} px`
                  : '',
                upscaleFactor,
                true
              )}
              disabled={imageSize && isTooLarge(imageSize.width * 4, imageSize.height * 4)}
            />
          </RadioGroup>
        </FormControl>

        <Box sx={{ m: 0, display: 'flex', justifyContent: 'flex-start' }}>
          {isTooLarge(imageSize.width * 2, imageSize.height * 2) &&
          isTooLarge(imageSize.width * 4, imageSize.height * 4) ? (
            <Button variant="contained" onClick={closeUpscaleDialog} endIcon={<Cancel />} sx={CustomizedSendButton}>
              {'Cancel'}
            </Button>
          ) : (
            <Button variant="contained" onClick={onUpscaleSubmit} endIcon={<Send />} sx={CustomizedSendButton}>
              {'Ok'}
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
