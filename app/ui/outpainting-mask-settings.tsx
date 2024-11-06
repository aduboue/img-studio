import {
  AlignHorizontalCenter,
  AlignHorizontalLeft,
  AlignHorizontalRight,
  AlignVerticalBottom,
  AlignVerticalCenter,
  AlignVerticalTop,
} from '@mui/icons-material'
import {
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Divider,
  Box,
  FormControl,
  FormHelperText,
  Input,
  InputAdornment,
} from '@mui/material'
import theme from '../theme'
import { useState } from 'react'
import { RatioToPixel } from '../api/generate-utils'
import { ChipGroup } from './components/InputChipGroup'
import { OutpaintPreview } from './components/OutpaintPreview'
const { palette } = theme

const customToggleButtonGroup = {
  '& .MuiToggleButton-root': {
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&.Mui-selected': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  },
}

const customToggleButton = {
  p: 0,
  backgroundColor: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
}

const customToggleButtonLabel = {
  fontSize: '0.75rem',
  fontWeight: 500,
  lineHeight: '1.3em',
  pr: 1.5,
}

export default function OutpaintingMaskSettings({
  alignHorizontal,
  alignVertical,
  handleHorizontalChange,
  handleVerticalChange,
  imageSize,
  maskSize,
  setMaskSize,
  outpaintPosition,
  outpaintCanvasRef,
  setMaskImage,
  userUploadedImage,
  setOutpaintedImage,
}: {
  alignHorizontal: string
  alignVertical: string
  handleHorizontalChange: (event: any, newValue: string) => void
  handleVerticalChange: (event: any, newValue: string) => void
  imageSize: { width: number; height: number; ratio: string }
  maskSize: { width: number; height: number }
  setMaskSize: (value: { width: number; height: number }) => void
  outpaintPosition: { horizontal: string; vertical: string }
  outpaintCanvasRef: React.RefObject<HTMLCanvasElement>
  setMaskImage: (value: string | null) => void
  userUploadedImage: string | null
  setOutpaintedImage: (value: string | null) => void
}) {
  const [outpaintRatio, setOutpaintRatio] = useState('')
  const handleChipClick = ({ clickedValue, currentValue }: { clickedValue: string; currentValue: string }) => {
    if (clickedValue !== currentValue) {
      setOutpaintRatio(clickedValue)

      // Calculate new dimensions based on the selected ratio
      const newRatio = clickedValue.split(':').map(Number)
      const newWidth = Math.max(imageSize.width, Math.round(imageSize.height * (newRatio[0] / newRatio[1])))
      const newHeight = Math.max(imageSize.height, Math.round(imageSize.width * (newRatio[1] / newRatio[0])))
      setMaskSize({ width: newWidth, height: newHeight })
    }
  }

  return (
    <Box sx={{ p: 0, pl: 3, pt: 1 }}>
      <Typography
        variant="caption"
        sx={{
          color: palette.text.primary,
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: '1.3em',
          pb: 0.5,
          pl: 0.8,
        }}
      >
        {'Manually set new dimensions'}
      </Typography>
      <Stack direction="row" spacing={2} sx={{ pl: 1, alignItems: 'center' }}>
        <FormControl variant="standard" sx={{ m: 1, mt: 3, width: 75 }}>
          <Input
            value={maskSize.width}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setMaskSize({
                ...maskSize,
                width: parseInt(event.target.value, 10),
              })
            }}
            size="small"
            endAdornment={
              <InputAdornment
                position="end"
                sx={{
                  mx: 0,
                  '& .MuiTypography-root': { fontSize: '1rem', fontWeight: 400, color: palette.secondary.main },
                }}
              >
                {'px'}
              </InputAdornment>
            }
            inputProps={{
              type: 'number',
            }}
            sx={{ '& .MuiInput-input': { padding: 0, width: '80%', color: palette.primary.main } }}
          />
          <FormHelperText sx={{ color: palette.secondary.main }}>{'Width'}</FormHelperText>
        </FormControl>
        <Typography sx={{ fontWeight: 500, color: palette.secondary.main }}>{'/'}</Typography>
        <FormControl variant="standard" sx={{ m: 1, mt: 3, width: 75 }}>
          <Input
            value={maskSize.height}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setMaskSize({
                ...maskSize,
                height: parseInt(event.target.value, 10),
              })
            }}
            size="small"
            endAdornment={
              <InputAdornment
                position="end"
                sx={{
                  mx: 0,
                  '& .MuiTypography-root': { fontSize: '1rem', fontWeight: 400, color: palette.secondary.main },
                }}
              >
                {'px'}
              </InputAdornment>
            }
            inputProps={{
              type: 'number',
            }}
            sx={{ '& .MuiInput-input': { padding: 0, width: '80%', color: palette.primary.main } }}
          />
          <FormHelperText sx={{ color: palette.secondary.main }}>{'Height'}</FormHelperText>
        </FormControl>
      </Stack>
      <Box sx={{ pb: 1.5, pt: 2.5, pl: 0.7 }}>
        <ChipGroup
          width={'100%'}
          label={'Or select a new target ratio'}
          required={false}
          options={RatioToPixel.map((option) => option.ratio)}
          value={outpaintRatio}
          onChange={handleChipClick}
          handleChipClick={handleChipClick}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: palette.text.primary,
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: '1.3em',
          pb: 0,
          pl: 0.8,
        }}
      >
        {'Position the original image'}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ pt: 0.5, pl: 0.5, alignItems: 'center' }}>
        <ToggleButtonGroup
          value={alignHorizontal}
          color="primary"
          size="small"
          aria-label="AlignHorizontal"
          sx={customToggleButtonGroup}
        >
          <ToggleButton
            onClick={handleHorizontalChange}
            value="left"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <AlignHorizontalLeft sx={{ ml: 0, fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Left'}
            </Typography>
          </ToggleButton>
          <ToggleButton
            onClick={handleHorizontalChange}
            value="center"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <AlignHorizontalCenter sx={{ ml: 0.7, fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Center'}
            </Typography>
          </ToggleButton>
          <ToggleButton
            onClick={handleHorizontalChange}
            value="right"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <AlignHorizontalRight sx={{ ml: 0.7, fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Right'}
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
        <Divider flexItem orientation="vertical" sx={{ mx: 0, px: 0, my: 1 }} />
        <ToggleButtonGroup
          value={alignVertical}
          color="primary"
          size="small"
          aria-label="AlignVertical"
          sx={customToggleButtonGroup}
        >
          <ToggleButton
            onClick={handleVerticalChange}
            value="bottom"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <AlignVerticalBottom sx={{ ml: 0.7, fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Bottom'}
            </Typography>
          </ToggleButton>
          <ToggleButton
            onClick={handleVerticalChange}
            value="center"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <AlignVerticalCenter sx={{ ml: 0.7, fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Center'}
            </Typography>
          </ToggleButton>
          <ToggleButton
            onClick={handleVerticalChange}
            value="top"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <AlignVerticalTop sx={{ ml: 0, fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Top'}
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ pb: 1.5, pt: 2.5, pl: 0.7 }}>
        <Typography
          variant="caption"
          sx={{
            color: palette.text.primary,
            fontSize: '0.75rem',
            fontWeight: 500,
            lineHeight: '1.3em',
            pb: 0,
            pt: 6,
          }}
        >
          {'Output composition preview'}
        </Typography>
        <OutpaintPreview
          outpaintPosition={outpaintPosition}
          imageSize={imageSize}
          maskSize={maskSize}
          outpaintCanvasRef={outpaintCanvasRef}
          setMaskImage={setMaskImage}
          userUploadedImage={userUploadedImage}
          setOutpaintedImage={setOutpaintedImage}
        />
        {maskSize.width === imageSize.width && maskSize.height === imageSize.height && (
          <Typography
            variant="caption"
            sx={{
              color: palette.error.main,
              fontSize: '0.75rem',
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: '1.3em',
              pb: 0,
              pt: 6,
            }}
          >
            {'Please select new dimensions.'}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
