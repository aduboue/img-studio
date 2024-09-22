'use client'

import * as React from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Box,
  IconButton,
  Stack,
  Avatar,
} from '@mui/material'
import {
  Send as SendIcon,
  WatchLater as WatchLaterIcon,
  ArrowDownward as ArrowDownwardIcon,
  Autorenew,
} from '@mui/icons-material'

import { GenerateImageFormI, ImageI } from '../api/generate-utils'

import theme from '../theme'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from './components/Button-SX'
import { useEffect, useState } from 'react'
import CustomTooltip from './components/Tooltip'
import { CustomizedAccordion, CustomizedAccordionSummary } from './components/Accordion-SX'
import { MetadataFilterFields } from '../api/export-utils'
import FormInputChipGroupMultiple from './components/InputChipGroupMultiple'
const { palette } = theme

export default function LibraryFiltering({
  isImagesLoading,
  setIsImagesLoading,
  setErrorMsg,
  submitFilters,
}: {
  isImagesLoading: boolean
  setIsImagesLoading: any
  setErrorMsg: any
  submitFilters: any
}) {
  const { handleSubmit, reset, control, setValue, getValues } = useForm<GenerateImageFormI>()
  const [openFilters, setOpenFilters] = useState(false)

  const onSubmit: SubmitHandler<GenerateImageFormI> = async (formData: GenerateImageFormI) => {
    setIsImagesLoading(true)
    setOpenFilters(false)

    try {
      submitFilters(formData)
      console.log(JSON.stringify(formData, undefined, 4)) //TODO remove
    } catch (error: any) {
      setErrorMsg(error.toString())
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Accordion
          disableGutters
          sx={{ ...CustomizedAccordion, width: '70%' }}
          expanded={openFilters}
          onChange={() => setOpenFilters(!openFilters)}
        >
          <AccordionSummary
            expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
            aria-controls="panel1-content"
            id="panel1-header"
            sx={CustomizedAccordionSummary}
          >
            <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
              {'Setup filters'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={5} sx={{ pl: 2, pr: 4 }}>
              {MetadataFilterFields.map(function ({ key, field }: any) {
                return (
                  <Box key={key} width="100%" sx={{ px: 0 }}>
                    <FormInputChipGroupMultiple
                      name={key}
                      label={field.label}
                      key={key}
                      control={control}
                      setValue={setValue}
                      width="400"
                      options={field.options}
                      required={false}
                    />
                  </Box>
                )
              })}
            </Stack>
            <Stack direction="row" gap={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={isImagesLoading}
                endIcon={isImagesLoading ? <WatchLaterIcon /> : <SendIcon />}
                sx={CustomizedSendButton}
              >
                {'Fetch'}
              </Button>
              <CustomTooltip title="Reset all filters" size="small">
                <IconButton onClick={() => reset()} aria-label="Reset form" disableRipple sx={{ px: 0.5 }}>
                  <Avatar sx={CustomizedAvatarButton}>
                    <Autorenew sx={CustomizedIconButton} />
                  </Avatar>
                </IconButton>
              </CustomTooltip>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </form>
    </>
  )
}
