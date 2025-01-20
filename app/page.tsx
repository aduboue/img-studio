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

'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Image from 'next/image'
import icon from '../public/ImgStudioLogo.svg'
import GoogleSignInButton from './ui/ux-components/GoogleSignInButton'
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
