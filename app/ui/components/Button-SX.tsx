import theme from '../../theme'
const { palette } = theme

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

export const CustomizedAvatarButton = {
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

export const CustomizedSendButton = {
  borderRadius: 7,
  border: 1,
  borderColor: 'white',
  boxShadow: 0,
  my: 1.5,
  ml: 1,
  py: 0.5,
  pr: 1.5,
  fontSize: '1rem',
  '&:hover': {
    background: 'white',
    color: palette.primary.main,
    border: 1,
    borderColor: palette.primary.main,
    boxShadow: 0,
  },
}
