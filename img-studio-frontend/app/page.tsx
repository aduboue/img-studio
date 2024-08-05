import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import Image from 'next/image';
import icon from 'public/ImgStudioLogo.svg';
import GoogleSignInButton from 'app/ui/GoogleSignInButton.js';


//TODO update with welcome href

export default function Page() {
  return (
    <main>
      <Box
        justifyContent="left"
        minHeight="100vh"
        pl={15}
        pt={10}
      >
        <Image
          priority
          src={icon}
          width={800}
          alt="ImgStudio"
        />
        <Box sx={{pl: 2}}>
          <Link href="/generate">
            <GoogleSignInButton/>
          </Link>
        </Box>
      </Box>
    </main>
  );
}