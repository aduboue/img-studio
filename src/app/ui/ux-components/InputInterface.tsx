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

import { advancedSettingsI, chipGroupFieldsI, generalSettingsI, selectFieldsI } from '../../api/generate-utils'

export interface FormTextInputI {
  name: string
  label: string
  control: any
  required: boolean
  rows: number
}

export interface FormDropdownInputI {
  name: string
  label: string
  control: any
  styleSize: string
  width: string
  setValue?: any
  field: selectFieldsI
  required: boolean
}

export interface FormChipGroupInputI {
  name: string
  label: string
  control: any
  width: string
  setValue?: any
  field?: chipGroupFieldsI
  required: boolean
  disabled?: boolean
}

export interface FormChipGroupMultipleInputI {
  name: string
  label: string
  control: any
  width: string
  setValue?: any
  options?: { value: string; label: string }[]
  required: boolean
}

export interface FormInputGenerateSettingsI {
  control: any
  setValue?: any
  generalSettingsFields: generalSettingsI
  advancedSettingsFields: advancedSettingsI
}

export interface FormInputRadioButtonI {
  label: string
  subLabel: string
  value: string
  currentSelectedValue: string
  enabled: boolean
}
