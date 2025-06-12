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

import { ImageI } from './generate-image-utils'
import { VideoI } from './generate-video-utils'

export interface ExportMediaFieldI {
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

export interface ExportMediaFormFieldsI {
  id: ExportMediaFieldI
  gcsURI: ExportMediaFieldI
  creationDate: ExportMediaFieldI
  leveragedModel: ExportMediaFieldI
  author: ExportMediaFieldI
  prompt: ExportMediaFieldI
  format: ExportMediaFieldI
  videoDuration: ExportMediaFieldI
  videoThumbnailGcsUri: ExportMediaFieldI
  aspectRatio: ExportMediaFieldI
  upscaleFactor: ExportMediaFieldI
  width: ExportMediaFieldI
  height: ExportMediaFieldI
  [key: string]: ExportMediaFieldI
}

export const exportStandardFields: ExportMediaFormFieldsI = {
  id: {
    label: 'Media ID',
    type: 'text-info',
    prop: 'key',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: false,
  },
  gcsURI: {
    label: 'Media GCS URI',
    type: 'text-info',
    prop: 'gcsUri',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: false,
  },
  creationDate: {
    label: 'Generation date',
    type: 'text-info',
    prop: 'date',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: true,
  },
  leveragedModel: {
    label: 'Leveraged model',
    type: 'text-info',
    prop: 'modelVersion',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: true,
  },
  mediaCreationMode: {
    label: 'Creation mode',
    type: 'text-info',
    prop: 'mode',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: true,
  },
  author: {
    label: 'Author',
    type: 'text-info',
    prop: 'author',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: true,
  },
  prompt: {
    label: 'Prompt',
    type: 'text-info',
    prop: 'prompt',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  format: {
    label: 'Format',
    type: 'text-info',
    prop: 'format',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  videoDuration: {
    label: 'Duration (sec)',
    type: 'text-info',
    prop: 'duration',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  videoThumbnailGcsUri: {
    label: 'Video Thumbnail GCS URI',
    type: 'text-info',
    prop: 'videoThumbnailGcsUri',
    isUpdatable: false,
    isExportVisible: false,
    isExploreVisible: false,
  },
  aspectRatio: {
    label: 'Ratio',
    type: 'text-info',
    prop: 'ratio',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  upscaleFactor: {
    label: 'Scale factor',
    type: 'radio-button',
    prop: 'upscaleFactor',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  width: {
    label: 'Width (px)',
    type: 'text-info',
    prop: 'width',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
  height: {
    label: 'Height (px)',
    type: 'text-info',
    prop: 'height',
    isUpdatable: false,
    isExportVisible: true,
    isExploreVisible: true,
  },
}

export interface ExportMediaFormI {
  mediaToExport: ImageI | VideoI
  upscaleFactor: string
  [key: string]: any
}

export interface FilterMediaFormI {
  [key: string]: any
}

export interface MediaMetadataI {
  id: string
  gcsURI: string
  creationDate: any
  leveragedModel: string
  author: string
  prompt: string
  format: string
  videoDuration?: number
  videoThumbnailGcsUri?: string
  aspectRatio: string
  upscaleFactor?: string
  width: number
  height: number
  [key: string]: any
}

export type MediaMetadataWithSignedUrl = MediaMetadataI & { signedUrl: string; videoThumbnailSignedUrl?: string }
