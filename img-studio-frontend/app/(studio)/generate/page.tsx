'use client'

import * as React from 'react'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import theme from 'app/theme'
import GenerateForm from 'app/ui/generate-form'
import StandardImageList from 'app/ui/image-display'

const palette = theme.palette

export default function Page() {
  return (
    <Box p={5}>
      <Grid container spacing={6} direction="row" columns={2}>
        <Grid size={1.1}>
          <GenerateForm />
        </Grid>
        <Grid size={0.9} sx={{ pt: 10 }}>
          <StandardImageList />
        </Grid>
      </Grid>
    </Box>
  )
}
