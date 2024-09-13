import { ImageI } from './generate-utils'

export interface ExportImageFieldI {
  label: string
  type: string
  prop?: string
  isUpdatable: boolean
  isMandatory?: boolean
  isVisible: boolean
  options?: {
    value: string
    label: string
  }[]
}

export interface ExportImageFormFieldsI {
  imageGcsURI: ExportImageFieldI
  imageGenerationDate: ExportImageFieldI
  imageLeveragedModel: ExportImageFieldI
  imageAuthor: ExportImageFieldI
  imagePrompt: ExportImageFieldI
  imageFormat: ExportImageFieldI
  imageRatio: ExportImageFieldI
  imageUpscaledFactor: ExportImageFieldI
  imageWidth: ExportImageFieldI
  imageHeight: ExportImageFieldI
  contextAuthorTeam: ExportImageFieldI
  contextAssociatedBrand: ExportImageFieldI
  contextCollection: ExportImageFieldI
  contextTargetPlatform: ExportImageFieldI
}

export const ExportImageFormFields: ExportImageFormFieldsI = {
  imageGcsURI: {
    label: 'Image GCS URI',
    type: 'text-info',
    prop: 'gcsUri',
    isUpdatable: false,
    isVisible: false,
  },
  imageGenerationDate: {
    label: 'Generation date',
    type: 'text-info',
    prop: 'date',
    isUpdatable: false,
    isVisible: false,
  },
  imageLeveragedModel: {
    label: 'Leveraged Model',
    type: 'text-info',
    prop: 'modelVestion',
    isUpdatable: false,
    isVisible: false,
  },
  imageAuthor: {
    label: 'Author',
    type: 'text-info',
    prop: 'author',
    isUpdatable: false,
    isVisible: false,
  },
  imagePrompt: {
    label: 'Prompt',
    type: 'text-info',
    prop: 'prompt',
    isUpdatable: false,
    isVisible: true,
  },
  imageFormat: {
    label: 'Format',
    type: 'text-info',
    prop: 'format',
    isUpdatable: false,
    isVisible: true,
  },
  imageRatio: {
    label: 'Ratio',
    type: 'text-info',
    prop: 'ratio',
    isUpdatable: false,
    isVisible: true,
  },
  imageUpscaledFactor: {
    label: 'Scale factor',
    type: 'radio-button',
    isUpdatable: false,
    isVisible: true,
    options: [
      {
        value: '',
        label: 'No upscaling',
      },
      {
        value: 'x2',
        label: 'Social Media content',
      },
      {
        value: 'x4',
        label: 'Human Ressources',
      },
    ],
  },
  imageWidth: {
    label: 'Width (px)',
    type: 'text-info',
    prop: 'width',
    isUpdatable: false,
    isVisible: true,
  },
  imageHeight: {
    label: 'Height (px)',
    type: 'text-info',
    prop: 'height',
    isUpdatable: false,
    isVisible: true,
  },
  contextAuthorTeam: {
    label: 'In which team are you?',
    type: 'select',
    isUpdatable: true,
    isMandatory: true,
    isVisible: true,
    options: [
      {
        value: 'marketing',
        label: 'Content marketing',
      },
      {
        value: 'social-media',
        label: 'Social Media',
      },
      {
        value: 'hr',
        label: 'Human Ressources',
      },
      {
        value: 'product',
        label: 'Product development',
      },
      {
        value: 'sales',
        label: 'Sales enablement',
      },
    ],
  },
  contextTargetPlatform: {
    label: 'For which platform is it targetted?',
    type: 'multiple-select',
    isUpdatable: true,
    isMandatory: true,
    isVisible: true,
    options: [
      {
        value: 'mailing',
        label: 'Mailing compaign',
      },
      {
        value: 'website',
        label: 'Public website',
      },
      {
        value: 'social-medias',
        label: 'Social medias',
      },
      {
        value: 'product',
        label: 'Product development',
      },
    ],
  },
  contextAssociatedBrand: {
    label: 'For which brand(s) did you create this image?',
    type: 'multiple-select',
    isUpdatable: true,
    isMandatory: false,
    isVisible: true,
    options: [
      {
        value: 'gemo',
        label: 'Gémo',
      },
      {
        value: 'mellow-yellow',
        label: 'Mellow Yellow',
      },
      {
        value: 'bocage',
        label: 'Bocage',
      },
      {
        value: 'maje',
        label: 'Maje',
      },
      {
        value: 'bash',
        label: 'Ba&sh',
      },
      {
        value: 'sessun',
        label: 'Sessùn',
      },
      {
        value: 'american-vintage',
        label: 'American Vintage',
      },
      {
        value: 'the-kooples',
        label: 'The Kooples',
      },
    ],
  },
  contextCollection: {
    label: 'To which collection(s) is it associated?',
    type: 'multiple-select',
    isUpdatable: true,
    isMandatory: false,
    isVisible: true,
    options: [
      {
        value: 'spring',
        label: 'Spring',
      },
      {
        value: 'summer',
        label: 'Summer',
      },
      {
        value: 'fall',
        label: 'Fall',
      },
      {
        value: 'winter',
        label: 'Winter',
      },
    ],
  },
}

export interface ExportImageFormI {
  imageToExport: ImageI
  upscaledFactor: string
  contextAuthorTeam: string
  contextAssociatedBrand: string[]
  contextCollection: string[]
  contextTargetPlatform: string[]
}

export const ExportImageFieldList: (keyof ExportImageFormFieldsI)[] = Object.keys(ExportImageFormFields).map(
  (key) => key as keyof ExportImageFormFieldsI
)

export const MetadataReviewFields = ExportImageFieldList.filter(
  (field) =>
    ExportImageFormFields[field].type === 'text-info' &&
    ExportImageFormFields[field].isVisible &&
    !ExportImageFormFields[field].isUpdatable
)

const temp: { [key: string]: ExportImageFormFieldsI[keyof ExportImageFormFieldsI] }[] = []

Object.entries(ExportImageFormFields).forEach(([name, field]) => {
  if (field.isUpdatable && field.isVisible) {
    temp.push({ [name]: field })
  }
})

export const MetadataImproveFields = temp
