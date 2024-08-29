import * as React from 'react'
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'

export const metadata = {
  title: 'ImgStudio',
  description: 'My description', //TODO écrire description site
}

//TODO dynamic routes metadata ?
// https://youtu.be/gSSsZReIFRk?t=702

export default function RootLayout(props: { children: React.ReactNode }) {
  //const { data: session } = useSession() //TODO

  return (
    <html lang="en">
      <body>
        {/*<SessionProvider session={session}> //TODO */}
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {props.children}
          </ThemeProvider>
        </AppRouterCacheProvider>
        {/*</SessionProvider>*/}
      </body>
    </html>
  )
}
