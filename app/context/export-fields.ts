const { filterFields } = require('./export-fields-options')

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
  [key: string]: ExportImageFieldI
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
  ...filterFields,
}
