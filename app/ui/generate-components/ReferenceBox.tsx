import React, { useState } from 'react'
import { Box, IconButton, Stack, CircularProgress } from '@mui/material'
import theme from '../../theme'
import ReferenceImageDropzone from './ReferenceImageDropzone'
import { maxReferences, ReferenceObjectI, referenceTypeField } from '@/app/api/generate-utils'
import { FormInputTextLine } from '../ux-components/InputTextLine'
import FormInputChipGroup from '../ux-components/InputChipGroup'
import { Clear, ForkLeftSharp } from '@mui/icons-material'
import { GeminiButton } from '../ux-components/GeminiButton'
import { cleanResult, getDescriptionFromGemini } from '@/app/api/gemini/action'
const { palette } = theme

export const ReferenceBox = ({
  objectKey,
  currentReferenceObject,
  onNewErrorMsg,
  control,
  setValue,
  removeReferenceObject,
  addAdditionalRefObject,
  refPosition,
  refCount,
}: {
  objectKey: string
  currentReferenceObject: ReferenceObjectI
  onNewErrorMsg: (msg: string) => void
  control: any
  setValue: any
  removeReferenceObject: (objectKey: string) => void
  addAdditionalRefObject: (objectKey: string) => void
  refPosition: number
  refCount: number
}) => {
  const noImageSet =
    currentReferenceObject.base64Image === '' ||
    currentReferenceObject.base64Image === null ||
    currentReferenceObject.base64Image === undefined
  const noDescriptionSet =
    currentReferenceObject.description === '' ||
    currentReferenceObject.description === null ||
    currentReferenceObject.description === undefined
  const noReferenceTypeSet =
    currentReferenceObject.referenceType === '' ||
    currentReferenceObject.referenceType === null ||
    currentReferenceObject.referenceType === undefined
  const isNewRef = noImageSet && noReferenceTypeSet && noDescriptionSet
  const isRefIncomplete = noImageSet || noReferenceTypeSet || noDescriptionSet

  let IDoptions = []
  for (let i = 1; i <= maxReferences; i++) IDoptions.push({ value: i.toString(), label: i.toString() })

  const [isGettingDescription, setIsGettingDescription] = useState(false)

  const getDescription = async () => {
    setIsGettingDescription(true)
    if (!noReferenceTypeSet && !noImageSet)
      try {
        const geminiReturnedDescription = await getDescriptionFromGemini(
          currentReferenceObject.base64Image,
          currentReferenceObject.referenceType
        )

        if (!(typeof geminiReturnedDescription === 'object' && 'error' in geminiReturnedDescription))
          setValue(`referenceObjects.${refPosition}.description`, geminiReturnedDescription as string)
      } catch (error) {
        console.error(error)
      } finally {
        setIsGettingDescription(false)
      }
  }

  return (
    <Stack
      key={objectKey + refPosition + '_stack'}
      direction="row"
      spacing={2.5}
      justifyContent="flex-start"
      alignItems="flex-start"
      sx={{ pt: 1, pl: 1, width: '100%' }}
    >
      <IconButton
        onClick={() => removeReferenceObject(objectKey)}
        disabled={isNewRef && refCount === 1}
        disableRipple
        sx={{
          border: 0,
          boxShadow: 0,
          p: 0,
          '&:hover': {
            color: palette.primary.main,
            backgroundColor: 'transparent',
            border: 0,
            boxShadow: 0,
          },
        }}
      >
        <Clear sx={{ fontSize: '1.3rem' }} />
      </IconButton>
      <ReferenceImageDropzone
        key={objectKey + refPosition + '_dropzone'}
        setReferenceImage={(base64Image: string) =>
          setValue(`referenceObjects.${refPosition}.base64Image`, base64Image)
        }
        referenceImage={currentReferenceObject.base64Image}
        onNewErrorMsg={onNewErrorMsg}
        setValue={setValue}
        addAdditionalRefObject={() => addAdditionalRefObject(objectKey)}
        isNewImagePossible={!isRefIncomplete && !currentReferenceObject.isAdditionalImage && refCount < maxReferences}
        refPosition={refPosition}
      />
      {!currentReferenceObject.isAdditionalImage && (
        <>
          <Box sx={{ width: '30%' }}>
            <FormInputChipGroup
              name={`referenceObjects.${refPosition}.referenceType`}
              label={referenceTypeField.label}
              key={objectKey + refPosition + '_type'}
              control={control}
              setValue={setValue}
              width="100%"
              field={referenceTypeField}
              required={false}
              disabled={noImageSet}
            />
          </Box>
          <Box>
            {!noReferenceTypeSet && (
              <Box sx={{ width: '100%' }}>
                <FormInputTextLine
                  key={objectKey + refPosition + '_description'}
                  control={control}
                  label={'Short description'}
                  name={`referenceObjects.${refPosition}.description`}
                  value={currentReferenceObject.description}
                  required={false}
                />
                {isGettingDescription ? (
                  <CircularProgress size={20} thickness={6} color="primary" />
                ) : (
                  <GeminiButton onClick={getDescription} />
                )}
              </Box>
            )}
          </Box>
        </>
      )}
      {currentReferenceObject.isAdditionalImage && (
        <Box
          sx={{
            border: 'none',
            width: '50%',
          }}
        >
          <ForkLeftSharp sx={{ color: palette.primary.main, fontSize: '1.7rem' }} />
        </Box>
      )}
    </Stack>
  )
}
