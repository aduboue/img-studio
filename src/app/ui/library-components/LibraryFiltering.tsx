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
import { useForm, SubmitHandler, useWatch } from 'react-hook-form'
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

import theme from '../../theme'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from '../ux-components/Button-SX'
import { useEffect, useRef } from 'react'
import CustomTooltip from '../ux-components/Tooltip'
import { CustomizedAccordion, CustomizedAccordionSummary } from '../ux-components/Accordion-SX'
import { FilterImageFormI } from '../../api/export-utils'
import FormInputChipGroupMultiple from '../ux-components/InputChipGroupMultiple'
import { useAppContext, appContextDataDefault } from '../../context/app-context'

const { palette } = theme

export default function LibraryFiltering({
  isImagesLoading,
  setIsImagesLoading,
  setErrorMsg,
  submitFilters,
  openFilters,
  setOpenFilters,
}: {
  isImagesLoading: boolean
  setIsImagesLoading: any
  setErrorMsg: any
  submitFilters: any
  openFilters: boolean
  setOpenFilters: any
}) {
  const { handleSubmit, reset, control, setValue } = useForm<FilterImageFormI>()

  const { appContext } = useAppContext()
  const ExportImageFormFields = appContext ? appContext.exportFields : appContextDataDefault.exportFields
  let temp2: any = []
  if (ExportImageFormFields) {
    Object.entries(ExportImageFormFields).forEach(([name, field]) => {
      if (field.isExportVisible && field.options !== undefined) {
        temp2.push({ key: name, field: field })
      }
    })
  }

  const MetadataFilterFields = temp2

  const watchedFields = useWatch({ control })
  const watchedFieldValues = useWatch({
    control,
    name: MetadataFilterFields.map((field: { key: any }) => field.key),
  })

  const prevSelectedFields = useRef<Set<string>>(new Set())

  useEffect(() => {
    const activeFieldKeys = MetadataFilterFields.filter(
      (field: { key: string | number }) => watchedFields[field.key]?.length > 0
    ).map((field: { key: any }) => field.key)

    // Check if any new fields have been selected
    const newSelections = activeFieldKeys.filter((key: any) => !prevSelectedFields.current.has(key))

    if (newSelections.length > 0) {
      // If there are new selections, reset other fields
      MetadataFilterFields.forEach((field: { key: any }) => {
        if (!newSelections.includes(field.key)) {
          setValue(field.key, [])
        }
      })
    }

    // Update the set of previously selected fields
    prevSelectedFields.current = new Set(activeFieldKeys)
  }, [watchedFieldValues, setValue])

  const onSubmit: SubmitHandler<FilterImageFormI> = async (formData: FilterImageFormI) => {
    setIsImagesLoading(true)
    setOpenFilters(false)

    try {
      submitFilters(formData)
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
          <AccordionDetails sx={{ pt: 1, pl: 3 }}>
            <Typography
              display="inline"
              sx={{ fontSize: '0.9rem', fontStyle: 'italic', color: palette.text.secondary, my: 2 }}
            >
              {'Filters can have multiple values, but only one filter can be used at once'}
            </Typography>
            <Stack direction="row" spacing={5} sx={{ pr: 4, pt: 2 }}>
              {MetadataFilterFields.map(function ({ key, field }: any) {
                return (
                  <Box key={key} width="100%" sx={{ px: 0 }}>
                    <FormInputChipGroupMultiple
                      name={key}
                      label={field.name}
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
            <Stack direction="row" gap={1} sx={{ pt: 2, pl: 0 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isImagesLoading}
                endIcon={isImagesLoading ? <WatchLaterIcon /> : <SendIcon />}
                sx={{ ...CustomizedSendButton, ...{ ml: 0 } }}
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
