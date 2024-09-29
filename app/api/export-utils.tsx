import { ImageI } from './generate-utils'

export interface ExportImageFieldI {
  label: string
  name?: string
  type: string
  prop?: string
  isUpdatable: boolean
  isMandatory?: boolean
  isExportVisible: boolean
  isExploreVisible: boolean
  options?: {
    value: string
    label: string
  }[]
}

export interface ExportImageFormFieldsI {
  imageID: ExportImageFieldI
  imageGcsURI: ExportImageFieldI
  imageGenerationDate: ExportImageFieldI
  imageLeveragedModel: ExportImageFieldI
  imageAuthor: ExportImageFieldI
  imagePrompt: ExportImageFieldI
  imageFormat: ExportImageFieldI
  imageRatio: ExportImageFieldI
  imageUpscaleFactor: ExportImageFieldI
  imageWidth: ExportImageFieldI
  imageHeight: ExportImageFieldI
  contextAuthorTeam: ExportImageFieldI
  contextAssociatedBrand: ExportImageFieldI
  contextCollection: ExportImageFieldI
  contextTargetPlatform: ExportImageFieldI
}

export const ExportImageFormFields: ExportImageFormFieldsI = {
  imageID: {
    label: 'Image ID',
    type: 'text-info',
    prop: 'key',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: false,
  },
  imageGcsURI: {
    label: 'Image GCS URI',
    type: 'text-info',
    prop: 'gcsUri',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: false,
  },
  imageGenerationDate: {
    label: 'Generation date',
    type: 'text-info',
    prop: 'date',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: true,
  },
  imageLeveragedModel: {
    label: 'Leveraged model',
    type: 'text-info',
    prop: 'modelVersion',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: true,
  },
  imageAuthor: {
    label: 'Author',
    type: 'text-info',
    prop: 'author',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: true,
  },
  imagePrompt: {
    label: 'Prompt',
    type: 'text-info',
    prop: 'prompt',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  imageFormat: {
    label: 'Format',
    type: 'text-info',
    prop: 'format',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  imageRatio: {
    label: 'Ratio',
    type: 'text-info',
    prop: 'ratio',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  imageUpscaleFactor: {
    label: 'Scale factor',
    type: 'radio-button',
    prop: 'upscaleFactor',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  imageWidth: {
    label: 'Width (px)',
    type: 'text-info',
    prop: 'width',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  imageHeight: {
    label: 'Height (px)',
    type: 'text-info',
    prop: 'height',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  contextAuthorTeam: {
    label: 'In which team are you?',
    name: 'Associated team(s)',
    type: 'select',
    isUpdatable: true,
    isMandatory: true,
    isExportVisible: true,
    isExploreVisible: true,

    options: [
      {
        value: 'marketing',
        label: 'Content marketing',
      },
      {
        value: 'communityManagement',
        label: 'Community Management',
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
    name: 'Targetted platform(s)',
    type: 'multiple-select',
    isUpdatable: true,
    isMandatory: true,
    isExportVisible: true,
    isExploreVisible: true,

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
        value: 'socialMedias',
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
    name: 'Associated brand(s)',
    type: 'multiple-select',
    isUpdatable: true,
    isMandatory: false,
    isExportVisible: true,
    isExploreVisible: true,

    options: [
      {
        value: 'gemo',
        label: 'Gémo',
      },
      {
        value: 'mellowYellow',
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
        value: 'americanVintage',
        label: 'American Vintage',
      },
      {
        value: 'theKooples',
        label: 'The Kooples',
      },
    ],
  },
  contextCollection: {
    label: 'To which collection(s) is it associated?',
    name: 'Associated collection(s)',
    type: 'multiple-select',
    isUpdatable: true,
    isMandatory: false,
    isExportVisible: true,
    isExploreVisible: true,

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
  upscaleFactor: string
  [key: string]: any
}

export interface FilterImageFormI {
  [key: string]: any
}

export const ExportImageFieldList: (keyof ExportImageFormFieldsI)[] = Object.keys(ExportImageFormFields).map(
  (key) => key as keyof ExportImageFormFieldsI
)

export const MetadataReviewFields = ExportImageFieldList.filter(
  (field) =>
    ExportImageFormFields[field].type === 'text-info' &&
    ExportImageFormFields[field].isExportVisible &&
    !ExportImageFormFields[field].isUpdatable
)

const temp: { [key: string]: ExportImageFormFieldsI[keyof ExportImageFormFieldsI] }[] = []

Object.entries(ExportImageFormFields).forEach(([name, field]) => {
  if (field.isUpdatable && field.isExportVisible) {
    temp.push({ [name]: field })
  }
})

export const MetadataImproveFields = temp

export interface ImageMetadataI {
  imageID: string
  imageGcsURI: string
  imageGenerationDate: any
  imageLeveragedModel: string
  imageAuthor: string
  imagePrompt: string
  imageFormat: string
  imageRatio: string
  imageUpscaleFactor: string
  imageWidth: number
  imageHeight: number
  [key: string]: any
}

let temp2: any = []

Object.entries(ExportImageFormFields).forEach(([name, field]) => {
  if (field.isExportVisible && field.options !== undefined) {
    temp2.push({ key: name, field: field })
  }
})

export const MetadataFilterFields = temp2

export type ImageMetadataWithSignedUrl = ImageMetadataI & { signedUrl: string }
