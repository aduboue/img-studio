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
import { useState } from 'react'

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
  FormLabel,
  Radio,
} from '@mui/material'
import { ImageI } from '../../api/generate-image-utils'
import { TransitionProps } from '@mui/material/transitions'
import { CustomizedSendButton } from '../ux-components/Button-SX'
import { Close, Send, WatchLater } from '@mui/icons-material'
import { CustomRadioButton, CustomRadioLabel } from '../ux-components/InputRadioButton'

import theme from '../../theme'
import { downloadMediaFromGcs } from '../../api/cloud-storage/action'
import { upscaleImage } from '../../api/imagen/action'
import { useAppContext } from '../../context/app-context'
import { ExportAlerts } from './ExportAlerts'

const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export const downloadBase64Media = (base64Data: any, filename: string, format: string) => {
  const link = document.createElement('a')
  link.href = `data:${format};base64,${base64Data}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function DownloadDialog({
  open,
  mediaToDL,
  handleMediaDLClose,
}: {
  open: boolean
  mediaToDL: ImageI | undefined
  handleMediaDLClose: () => void
}) {
  const [upscaleFactor, setUpscaleFactor] = useState('no')
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpscaleFactor((event.target as HTMLInputElement).value)
  }

  const [status, setStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { appContext } = useAppContext()

  const handleImageDL = async () => {
    setStatus('Starting...')

    const media = mediaToDL

    if (media) {
      try {
        // 1. Upscale if needed
        let res
        if (upscaleFactor === 'x2' || upscaleFactor === 'x4') {
          try {
            setStatus('Upscaling...')

            res = await upscaleImage({ uri: media.gcsUri }, upscaleFactor, appContext)
            if (typeof res === 'object' && 'error' in res && res.error) throw Error(res.error.replaceAll('Error: ', ''))

            media.gcsUri = res.newGcsUri
          } catch (error: any) {
            throw Error(error)
          }
        }

        // 2. DL locally
        try {
          setStatus('Preparing download...')
          const res = await downloadMediaFromGcs(media.gcsUri)
          const name = `${media.key}.${media.format.toLowerCase()}`
          downloadBase64Media(res.data, name, media.format)

          if (typeof res === 'object' && res.error) throw Error(res.error.replaceAll('Error: ', ''))
        } catch (error: any) {
          throw Error(error)
        }

        setStatus('')
        onClose()
      } catch (error: any) {
        console.log(error)
        setErrorMsg('Error while upscaling your image')
      }
    }
  }

  const onClose = () => {
    handleMediaDLClose()
    setErrorMsg('')
  }

  const isTooLarge = (width: number, height: number) => width > 5000 || height > 5000

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            {'Download image'}
          </Typography>
        </DialogTitle>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 0, width: '90%' }}>
          {'You can upscale resolution to have a sharper and clearer look.'}
        </Typography>
        <FormControl>
          <RadioGroup value={upscaleFactor} onChange={handleChange} sx={{ p: 2, pl: 0.5 }}>
            <FormControlLabel
              value="no"
              control={<CustomRadioButton />}
              label={CustomRadioLabel(
                'no',
                'No upscaling',
                mediaToDL ? `${mediaToDL.width} x ${mediaToDL.height} px` : '',
                upscaleFactor,
                true
              )}
            />
            <FormControlLabel
              value="x2"
              control={<CustomRadioButton />}
              label={CustomRadioLabel(
                'x2',
                'Scale x2',
                mediaToDL && isTooLarge(mediaToDL.width * 2, mediaToDL.height * 2)
                  ? 'Unavailable, image too large'
                  : mediaToDL
                  ? `${mediaToDL.width * 2} x ${mediaToDL.height * 2} px`
                  : '',
                upscaleFactor,
                true
              )}
              disabled={mediaToDL && isTooLarge(mediaToDL.width * 2, mediaToDL.height * 2)}
            />
            <FormControlLabel
              value="x4"
              control={<CustomRadioButton />}
              label={CustomRadioLabel(
                'x4',
                'Scale x4',
                mediaToDL && isTooLarge(mediaToDL.width * 4, mediaToDL.height * 4)
                  ? 'Unavailable, image too large'
                  : mediaToDL
                  ? `${mediaToDL.width * 4} x ${mediaToDL.height * 4} px`
                  : '',
                upscaleFactor,
                true
              )}
              disabled={mediaToDL && isTooLarge(mediaToDL.width * 4, mediaToDL.height * 4)}
            />
          </RadioGroup>
        </FormControl>

        <Box sx={{ m: 0, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={status !== ''}
            onClick={handleImageDL}
            endIcon={status !== '' ? <WatchLater /> : <Send />}
            sx={CustomizedSendButton}
          >
            {status ? status : 'Download'}
          </Button>
        </Box>
      </DialogContent>

      {errorMsg !== '' && (
        <ExportAlerts
          message={errorMsg}
          style="error"
          onClose={() => {
            setErrorMsg('')
            setStatus('')
          }}
        />
      )}
    </Dialog>
  )
}
