import { Clear, Draw, DriveFileRenameOutlineOutlined, Redo, Undo } from '@mui/icons-material'
import { Stack, ToggleButtonGroup, ToggleButton, Typography, Divider, Box } from '@mui/material'
import { CustomSlider } from '../ux-components/InputSlider'
import theme from '../../theme'
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

export default function ManualMaskSelection({
  brushType,
  brushSize,
  handleChangeBrushType,
  handleChangeBrushSize,
  handleUndoClick,
  handleRedoClick,
  handleClearClick,
}: {
  brushType: string
  brushSize: number
  handleChangeBrushType: any
  handleChangeBrushSize: any
  handleUndoClick: () => void
  handleRedoClick: () => void
  handleClearClick: () => void
}) {
  return (
    <Box sx={{ px: 3, pt: 1.5, pb: 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <ToggleButtonGroup
          color="primary"
          size="small"
          value={brushType}
          exclusive
          onChange={handleChangeBrushType}
          aria-label="Brush type"
          sx={customToggleButtonGroup}
        >
          <ToggleButton value="Brush" sx={customToggleButton}>
            <Draw sx={{ fontSize: '1.5rem' }} />
            <Typography
              variant="caption"
              sx={{
                ...customToggleButtonLabel,
                color: brushType === 'Brush' ? palette.primary.main : palette.secondary.main,
              }}
            >
              {'Brush'}
            </Typography>
          </ToggleButton>
          <ToggleButton value="Eraser" sx={customToggleButton}>
            <DriveFileRenameOutlineOutlined sx={{ fontSize: '1.5rem' }} />
            <Typography
              variant="caption"
              sx={{
                ...customToggleButtonLabel,
                color: brushType === 'Eraser' ? palette.primary.main : palette.secondary.main,
              }}
            >
              {'Eraser'}
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
        <Divider flexItem orientation="vertical" sx={{ mx: 0, px: 0, my: 1 }} />
        <ToggleButtonGroup
          color="primary"
          size="small"
          value={brushType}
          aria-label="Actions"
          sx={customToggleButtonGroup}
        >
          <ToggleButton
            onClick={handleUndoClick}
            value="Undo"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <Undo sx={{ fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Undo'}
            </Typography>
          </ToggleButton>
          <ToggleButton
            onClick={handleRedoClick}
            value="Redo"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <Redo sx={{ fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Redo'}
            </Typography>
          </ToggleButton>
          <ToggleButton
            onClick={handleClearClick}
            value="Clear"
            sx={{ ...customToggleButton, '&:hover': { color: palette.primary.main } }}
          >
            <Clear sx={{ fontSize: '1.5rem' }} />
            <Typography variant="caption" sx={customToggleButtonLabel}>
              {'Clear'}
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ pt: 0.5 }}>
        <CustomSlider
          label={brushType + ' size'}
          value={brushSize}
          onChange={handleChangeBrushSize}
          min={1}
          max={50}
          step={1}
        />
      </Box>
    </Box>
  )
}
