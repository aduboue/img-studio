import theme from 'app/theme'
const palette = theme.palette

const onHover = {
  bgcolor: palette.primary.main,
  color: 'white',
  border: `0.5px solid rgba(0, 0, 0, 0)`,
}

export const CustomizedIconButton = {
  fontSize: '17px',
  color: 'black',
  position: 'center',
  pt: 0.1,
  pr: 0,
  '&:hover': onHover,
}

export const CustomizedAvartButton = {
  width: 24,
  height: 24,
  ml: 0.2,
  bgcolor: 'rgba(255,255,255,0.9)',
  border: `1px solid rgba(0, 0, 0, 0.3)`,
  '&:hover': onHover,
  boxShadow:
    '0px 2px 1px -1px rgba(0, 0, 0, 0.5), 0px 1px 1px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 0px rgba(0, 0, 0, 0.2)',
}

export const CustomizedIconButtonOpen = {
  ...onHover,
}
