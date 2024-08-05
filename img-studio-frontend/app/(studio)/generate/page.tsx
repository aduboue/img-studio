"use client";

import * as React from "react";
import Grid from '@mui/material/Grid';
import Box from "@mui/material/Box";
import theme from 'app/theme';

const palette = theme.palette;

export default function Page() {
  return (
    <Box sx={{p:5, flexGrow: 1}}>
      <Grid container spacing={5}>
        <Grid xs={6}>
          <Box sx={{p:5, width: '100%', bgcolor:'red'}}><p>test</p></Box>
        </Grid>
        <Grid xs>
          <Box><p>test</p></Box>
        </Grid>
      </Grid>
    </Box>
  );
}
