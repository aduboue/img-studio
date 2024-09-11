'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Image from 'next/image'
import icon from '../public/ImgStudioLogo.svg'
import GoogleSignInButton from '@/app/ui/components/GoogleSignInButton'
import { pages } from './routes'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const handleClick = () => {
    router.push(pages.Generate.href)
  }

  return (
    <main>
      <Box justifyContent="left" minHeight="100vh" pl={15} pt={10}>
        <Image priority src={icon} width={800} alt="ImgStudio" />
        <Box sx={{ pl: 2 }}>
          <GoogleSignInButton onClick={handleClick} />
        </Box>
      </Box>
    </main>
  )
}
