import { ExportImageFormFields, ExportImageFormFieldsI } from '../context/export-fields'
import { ImageI } from './generate-utils'

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
