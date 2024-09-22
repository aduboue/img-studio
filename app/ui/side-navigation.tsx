'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Drawer, List, ListItem, Typography, ListItemButton, Stack } from '@mui/material'

import Image from 'next/image'
import icon from '../../public/ImgStudioLogoReversedMini.svg'
import { pages } from '../routes'

import theme from '../theme'
const { palette } = theme

const drawerWidth = 265

const CustomizedDrawer = {
  background: palette.background.paper,
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paperAnchorLeft': {
    width: drawerWidth,
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

  return (
    <Drawer variant="permanent" anchor="left" sx={CustomizedDrawer}>
      <List dense>
        <ListItem sx={{ px: 2.5, pt: 2 }}>
          <Image priority src={icon} width={200} alt="ImgStudio" />
        </ListItem>

        {Object.values(pages).map(({ name, description, href, status }) => (
          <ListItemButton
            key={name}
            selected={pathname === href}
            disabled={status == 'coming-next'}
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
                  {status == 'new' ? '/ NEW' : status == 'coming-next' ? '/ SOON' : ''}
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
      {/*<List dense sx={{ position: 'absolute', bottom: '0', right: '0' }}>
        <Tooltip
          title="Log out"
          placement="left"
          TransitionComponent={Fade}
          TransitionProps={{ timeout: 600 }}
          enterDelay={100}
          leaveDelay={300}
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: { offset: [0, -25] },
                },
              ],
            },
          }}
        >
          <IconButton onClick={() => signOut()} aria-label="Log out" sx={{ px: 2, py: 1 }}>
            <LogoutIcon
              sx={{
                fontSize: 30,
                color: palette.secondary.light,
                '&:hover': { color: 'white' },
              }}
            />
          </IconButton>
        </Tooltip>
      </List>*/}
    </Drawer>
  )
}
