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
  [key: string]: ExportImageFieldI
}

export const ExportImageFormFieldsFixed: any = {
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
  imageCreationMode: {
    label: 'Creation mode',
    type: 'text-info',
    prop: 'mode',
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
}

export interface ExportImageFormI {
  imageToExport: ImageI
  upscaleFactor: string
  [key: string]: any
}

export interface FilterImageFormI {
  [key: string]: any
}

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

export type ImageMetadataWithSignedUrl = ImageMetadataI & { signedUrl: string }
