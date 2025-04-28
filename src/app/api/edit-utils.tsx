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

export interface EditImageFieldStyleI {
  type: string
  label: string
  description?: string
  default?: number | string
  min?: number
  max?: number
  step?: number
  isDataResetable: boolean
  options?:
    | {
        value: string
        label: string
        indication?: string
        description?: string
        mandatoryPrompt?: boolean
        mandatoryMask?: boolean
        maskType?: string[]
      }[]
    | string[]
}

export interface EditImageFormFieldsI {
  modelVersion: EditImageFieldStyleI
  inputImage: EditImageFieldStyleI
  inputMask: EditImageFieldStyleI
  prompt: EditImageFieldStyleI
  sampleCount: EditImageFieldStyleI
  negativePrompt: EditImageFieldStyleI
  editMode: EditImageFieldStyleI
  maskDilation: EditImageFieldStyleI
  baseSteps: EditImageFieldStyleI
  outputOptions: EditImageFieldStyleI
  personGeneration: EditImageFieldStyleI
}

export const EditImageFormFields = {
  modelVersion: {
    type: 'select',
    label: 'Model version',
    default: 'imagegeneration@006',
    options: [
      {
        value: 'imagegeneration@006',
        label: 'Imagen 2',
        indication: '',
      },
      {
        value: 'imagen-3.0-capability-001',
        label: 'Imagen 3 Edit',
        indication: '',
      }
    ],
    isDataResetable: false,
  },
  inputImage: {
    type: 'base64 encoded string',
    label: 'Input image',
    isDataResetable: true,
  },
  inputMask: {
    type: 'base64 encoded string',
    label: 'Input mask',
    isDataResetable: true,
  },
  prompt: {
    type: 'textInput',
    label: 'Prompt',
    isDataResetable: true,
  },
  sampleCount: {
    label: 'Quantity of outputs',
    type: 'chip-group',
    default: '4',
    options: ['1', '2', '3', '4'],
    isDataResetable: false,
  },
  negativePrompt: {
    label: 'Negative prompt',
    type: 'textInput',
    isDataResetable: true,
  },
  editMode: {
    type: 'in-place-menu',
    label: 'What do you want to do with your image?',
    default: 'inpainting-insert',
    options: [
      {
        value: 'inpainting-insert',
        label: 'Edit (Imagen2)',
        description: 'Change selected object(s)',
        icon: 'Insert',
        mandatoryPrompt: true,
        promptIndication: 'Prompt - Describe what you want to insert or update to the selected zone',
        mandatoryMask: true,
        maskButtonLabel: 'Select object(s)',
        maskButtonIcon: 'category',
        maskDialogTitle: 'Select object(s) to Edit',
        maskDialogIndication: 'Only selected pixels within can and will be edited',
        maskType: ['manual', 'background', 'foreground', 'semantic', 'interactive', 'prompt'],
        enabled: true,
        defaultMaskDilation: 0.01,
        defaultBaseSteps: 12,
      },
      {
        value: 'product-image',
        label: 'Product showcase(Imagen2)',
        description: 'Place product in a new scene',
        icon: 'store',
        mandatoryPrompt: true,
        promptIndication: 'Prompt - Describe in what situation you want to put the product',
        mandatoryMask: false,
        enabled: true,
        defaultMaskDilation: 0.0,
        defaultBaseSteps: 75,
      },
      {
        value: 'EDIT_MODE_INPAINT_INSERTION',
        label: 'Insert',
        description: 'Add a new object',
        icon: 'add_photo_alternate',
        mandatoryPrompt: true,
        promptIndication: 'Prompt - Describe what you want to insert to selected zone',
        mandatoryMask: true,
        maskButtonLabel: 'Select zone',
        maskButtonIcon: 'ads_click',
        maskDialogTitle: 'Select a zone where to insert',
        maskDialogIndication: 'Only pixels within the zone can and will be edited',
        maskType: ['manual', 'background', 'foreground', 'semantic', 'interactive', 'prompt'],
        enabled: true,
        defaultMaskDilation: 0.01,
        defaultBaseSteps: 35,
      },
      {
        value: 'EDIT_MODE_INPAINT_REMOVAL',
        label: 'Remove',
        description: 'Erase selected object(s)',
        icon: 'cancel',
        mandatoryPrompt: false,
        mandatoryMask: true,
        maskButtonLabel: 'Select object(s)',
        maskButtonIcon: 'category',
        maskDialogTitle: 'Select object(s) to be removed',
        maskDialogIndication: 'Only selected pixels within can and will be edited',
        maskType: ['manual', 'background', 'foreground', 'semantic', 'interactive', 'prompt'],
        enabled: true,
        defaultMaskDilation: 0.01,
        defaultBaseSteps: 12,
      },
      {
        value: 'EDIT_MODE_OUTPAINT',
        label: 'Outpaint',
        description: 'Extend the image',
        icon: 'aspect_ratio',
        mandatoryPrompt: false,
        promptIndication: '(Optional) Prompt - If you want, be specific on what to put in extended space',
        mandatoryMask: true,
        maskButtonLabel: 'New ratio',
        maskButtonIcon: 'crop',
        maskDialogTitle: 'Select your new image format',
        maskDialogIndication: 'Only pixels in outpaint zone will be edited',
        maskType: ['outpaint'], // Vertical/ Horizontal zones generated from new ratio and image position within it
        enabled: true,
        defaultMaskDilation: 0.03,
        defaultBaseSteps: 35,
      },
      {
        value: 'EDIT_MODE_BGSWAP',
        label: 'Product showcase',
        description: 'Place product in a new scene',
        icon: 'store',
        mandatoryPrompt: true,
        promptIndication: 'Prompt - Describe in what situation you want to put the product',
        mandatoryMask: false,
        enabled: true,
        defaultMaskDilation: 0.0,
        defaultBaseSteps: 75,
      },
      {
        value: 'EDIT_MODE_DEFAULT',
        label: 'Transform',
        description: "Change what's happening",
        icon: 'model_training',
        mandatoryPrompt: true,
        promptIndication: 'Prompt - Describe what you want to see change in the image',
        mandatoryMask: false,
        enabled: false,
        defaultMaskDilation: 0.01,
        defaultBaseSteps: 35,
      },
    ],
    isDataResetable: false,
  },
  maskDilation: {
    type: 'float',
    label: 'Mask dilation',
    description: 'Determines the dilation percentage of the mask provided',
    default: 0.01,
    min: 0.0,
    max: 0.3,
    step: 0.01,
    isDataResetable: true,
  },
  baseSteps: {
    type: 'integer',
    label: 'Base steps',
    description: 'Controls how many steps should be used to generate output',
    default: 35,
    min: 1,
    max: 100,
    step: 1,
    isDataResetable: true,
  },
  outputOptions: {
    label: 'Ouput format',
    type: 'select',
    default: 'image/png',
    options: [
      {
        value: 'image/png',
        label: 'PNG',
      },
      {
        value: 'image/jpeg',
        label: 'JPEG',
      },
    ],
    isDataResetable: false,
  },
  personGeneration: {
    label: 'People generation',
    type: 'select',
    default: 'allow_adult',
    options: [
      {
        value: 'dont_allow',
        label: 'No people',
      },
      {
        value: 'allow_adult',
        label: 'Adults only',
      },
      {
        value: 'allow_all',
        label: 'Adults & Children',
      },
    ],
    isDataResetable: false,
  },
}

export const maskTypes = [
  {
    value: 'manual',
    label: 'Manual selection',
    description: 'One or more zone(s) you manually brush over',
    readOnlyCanvas: false,
    requires: 'manualSelection',
  },
  {
    value: 'background',
    label: 'Background',
    description: 'Everything except the primary object, person, or subject',
    readOnlyCanvas: true,
  },
  {
    value: 'foreground',
    label: 'Foreground',
    description: 'Primary object, person, or subject only',
    readOnlyCanvas: true,
  },
  /*{ //TODO to be added back when feature fixed
    value: 'semantic',
    label: 'Semantic',
    description: 'One or more element(s) by their semantic class(es)',
    readOnlyCanvas: true,
    requires: 'semanticDropdown',
  },*/
  {
    value: 'interactive',
    label: 'Interactive',
    description: 'A zone targetted by circling or brushing over it',
    readOnlyCanvas: false,
    requires: 'manualSelection',
  },
  {
    value: 'prompt',
    label: 'Descriptive',
    description: 'A zone targetted through a written description of it',
    readOnlyCanvas: true,
    requires: 'promptInput',
  },
  {
    value: 'outpaint',
    label: 'Configure outpaint zone',
    description: 'A new image format to be edited in',
    readOnlyCanvas: true,
    requires: 'ratioSelection',
  },
]

export const semanticClasses = [
  { class_id: 43, value: 'Floor' },
  { class_id: 94, value: 'Gravel' },
  { class_id: 95, value: 'Platform' },
  { class_id: 96, value: 'Playingfield' },
  { class_id: 186, value: 'River Lake' },
  { class_id: 98, value: 'Road' },
  { class_id: 101, value: 'Runway' },
  { class_id: 187, value: 'Sea' },
  { class_id: 100, value: 'Sidewalk Pavement' },
  { class_id: 142, value: 'Sky' },
  { class_id: 99, value: 'Snow' },
  { class_id: 189, value: 'Swimming Pool' },
  { class_id: 102, value: 'Terrain' },
  { class_id: 191, value: 'Wall' },
  { class_id: 188, value: 'Water' },
  { class_id: 190, value: 'Waterfall' },
]

// Interface of Edit form fields
export interface EditImageFormI {
  modelVersion: string
  inputImage: string
  ratio: string
  width: number
  height: number
  inputMask: string
  prompt: string
  sampleCount: string
  negativePrompt: string
  editMode: string
  maskMode?: string
  maskDilation: string
  baseSteps: string
  outputOptions: string
  personGeneration: string
}

// Sort out Edit fields depending on purpose
export interface EditSettingsFieldsI {
  sampleCount: EditImageFieldStyleI
  maskDilation: EditImageFieldStyleI
  baseSteps: EditImageFieldStyleI
  outputOptions: EditImageFieldStyleI
  personGeneration: EditImageFieldStyleI
  negativePrompt: EditImageFieldStyleI
}
export const editSettingsFields: EditSettingsFieldsI = {
  sampleCount: EditImageFormFields.sampleCount,
  maskDilation: EditImageFormFields.maskDilation,
  baseSteps: EditImageFormFields.baseSteps,
  outputOptions: EditImageFormFields.outputOptions,
  personGeneration: EditImageFormFields.personGeneration,
  negativePrompt: EditImageFormFields.negativePrompt,
}

// Set default values for Edit Form
const editFieldList: [keyof EditImageFormFieldsI] = Object.keys(EditImageFormFields) as [keyof EditImageFormFieldsI]
export var formDataEditDefaults: any
editFieldList.forEach((field) => {
  const fieldParams: EditImageFieldStyleI = EditImageFormFields[field]
  const defaultValue = 'default' in fieldParams ? fieldParams.default : ''
  formDataEditDefaults = { ...formDataEditDefaults, [field]: defaultValue }
})
