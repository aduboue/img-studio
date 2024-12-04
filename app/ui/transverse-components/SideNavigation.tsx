'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Drawer, List, ListItem, Typography, ListItemButton, Stack, IconButton, Box } from '@mui/material'

import Image from 'next/image'
import icon from '../../../public/ImgStudioLogoReversedMini.svg'
import { pages } from '../../routes'

import theme from '../../theme'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
const { palette } = theme

const drawerWidth = 265
const drawerWidthClosed = 75

const CustomizedDrawer = {
  background: palette.background.paper,
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paperAnchorLeft': {
    width: drawerWidth,
    border: 0,
  },
}

const CustomizedDrawerClosed = {
  background: palette.background.paper,
  width: drawerWidthClosed,
  flexShrink: 0,
  '& .MuiDrawer-paperAnchorLeft': {
    width: drawerWidthClosed,
    border: 0,
  },
}

const CustomizedMenuItem = {
  px: 3,
  py: 2,
  '&:hover': { bgcolor: 'rgba(0,0,0,0.25)' },
  '&.Mui-selected, &.Mui-selected:hover': {
    bgcolor: 'rgba(0,0,0,0.5)',
  },
  '&.Mui-disabled': { bgcolor: 'transparent' },
  '&:hover, &.Mui-selected, &.Mui-selected:hover, &.Mui-disabled': {
    transition: 'none',
  },
}

export default function SideNav() {
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState(true)

  return (
    <Drawer variant="permanent" anchor="left" sx={open ? CustomizedDrawer : CustomizedDrawerClosed}>
      {!open && (
        <Box
          onClick={() => setOpen(!open)}
          sx={{
            pt: 6,
            cursor: 'pointer',
          }}
        >
          <Image
            priority
            src={icon}
            width={110}
            alt="ImgStudio"
            style={{
              transform: 'rotate(-90deg)',
            }}
          />
        </Box>
      )}
      {open && (
        <List dense>
          <ListItem onClick={() => setOpen(!open)} sx={{ px: 2.5, pt: 2, cursor: 'pointer' }}>
            <Image priority src={icon} width={200} alt="ImgStudio" />
          </ListItem>

          {Object.values(pages).map(({ name, description, href, status }) => (
            <ListItemButton
              key={name}
              selected={pathname === href}
              disabled={status == 'false'}
              onClick={() => router.push(href)}
              sx={CustomizedMenuItem}
            >
              <Stack alignItems="left" direction="column" sx={{ pr: 4 }}>
                <Stack alignItems="center" direction="row" gap={1.2} pb={0.5}>
                  <Typography
                    variant="body1"
                    color={pathname === href ? 'white' : palette.secondary.light}
                    fontWeight={pathname === href ? 500 : 400}
                  >
                    {name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={pathname === href ? palette.primary.light : palette.secondary.light}
                  >
                    {status == 'false' ? '/ SOON' : ''}
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  color={pathname === href ? palette.secondary.light : palette.secondary.main}
                  sx={{ fontSize: '0.9rem' }}
                >
                  {description}
                </Typography>
              </Stack>
            </ListItemButton>
          ))}
        </List>
      )}

      {open && (
        <Typography
          variant="caption"
          align="left"
          sx={{
            position: 'absolute',
            bottom: 15,
            left: 15,
            fontSize: '0.6rem',
            fontWeight: 400,
            color: palette.secondary.light,
          }}
        >
          / Made with <span style={{ margin: 1, color: palette.primary.main }}>❤</span> by
          <a
            href="https://www.linkedin.com/in/aduboue/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'white',
              fontWeight: 700,
              textDecoration: 'none',
              margin: 2,
            }}
          >
            @Agathe
          </a>
        </Typography>
      )}
      <IconButton
        onClick={() => setOpen(!open)}
        sx={{
          position: 'absolute',
          bottom: 5,
          p: 0,
          right: 15,
          fontSize: '0.6rem',
          fontWeight: 400,
          color: palette.secondary.light,
        }}
      >
        {open ? <ChevronLeft /> : <ChevronRight />}
      </IconButton>
    </Drawer>
  )
}
