"use client";

import * as React from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import ListItemButton from "@mui/material/ListItemButton";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import Image from 'next/image';
import icon from 'public/ImgStudioLogoReversed.svg';
import { useRouter } from 'next/navigation'
import theme from 'app/theme';

//TODO log out href

const drawerWidth = 285;
const palette = theme.palette;

const pages = [
  {
    name: "Generate",
    description: "Generate new content from scratch",
    href: "/generate",
    status: "new",
  },
  {
    name: "Edit",
    description: "Import and edit your existing content",
    href: "/edit",
    status: "new",
  },
  {
    name: "History",
    description: "Go through your content creation history",
    href: "/personal-history",
    status: "coming-next",
  },
  {
    name: "Library",
    description: "Browse your personal & shared content library",
    href: "/content-library",
    status: "coming-next",
  },
];

export default function PermanentDrawerLeft() {
  const [selectedPage, setSelectedPage] = React.useState(pages[0].name);
  const router = useRouter()

  const handleListItemClick = (
    _event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    selectedPage: string,
    href: string
  ) => {
    setSelectedPage(selectedPage);
    router.push(href);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        background: (theme) => theme.palette.background.paper,
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paperAnchorLeft": {
          width: drawerWidth,
          border: 0,
        },
      }}
    >
        <List dense>
            <ListItem sx={{px:2.5, pt:2, pb:4}}>
                <Image
                  priority
                  src={icon}
                  width={225}
                  alt="ImgStudio"
                />
            </ListItem>

            {pages.map(({ name, description, href, status }) => (
                <ListItemButton
                    key={name}
                    selected={selectedPage == name}
                    disabled={status == "coming-next"}
                    onClick={(event) => handleListItemClick(event, name, href)}
                    sx={{
                        px:3,
                        py:2,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.25)', transition: 'none'},
                        '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'rgba(0,0,0,0.5)', transition: 'none'},
                        '&.Mui-disabled': { bgcolor: 'transparent', transition: 'none'},
                    }}
                >
                    <Stack alignItems="left" direction="column" sx={{pr:4}}>
                        <Stack alignItems="center" direction="row" gap={1.2} pb={0.5}>
                            <Typography
                                variant="body2"
                                color={selectedPage == name ? "white" : palette.secondary.light}
                                fontWeight={selectedPage == name ? 500 : 400}
                            >
                                {name}
                            </Typography>
                            <Typography
                                variant="caption"
                                color={selectedPage == name ? palette.primary.light : palette.secondary.light}
                            >
                                {status == "new" ? '/ NEW' : status == "coming-next" ? '/ SOON' : ''}
                            </Typography>
                        </Stack>
                        <Typography
                            variant="body2"
                            color={selectedPage == name ? palette.secondary.light : palette.secondary.main}
                            sx = {{fontSize: '0.9rem'}}
                        >
                            {description}
                        </Typography>
                    </Stack>                
                </ListItemButton>
            ))}
      </List>
      <List dense sx={{position: "absolute", bottom: "0", right:"0"}}>
        <Tooltip
          title="Log out"
          placement="left"
          TransitionComponent={Fade}
          TransitionProps={{ timeout: 600 }}
          enterDelay={100}
          leaveDelay={300}
          slotProps={{popper: { modifiers: [{
              name: 'offset',
              options: {offset: [0, -25]}
            }]}
          }}
          sx= {{bgcolor:"white"}}
        >
            <IconButton
              aria-label="Log out"
              sx={{px: 2, py:1}}
              href="/"
            >
              <LogoutIcon 
                sx={{
                  fontSize:30,
                  color: palette.secondary.light,
                  '&:hover': { color: "white"},
                }}
              />
            </IconButton>
        </Tooltip>
      </List>
    </Drawer>
  );
}
