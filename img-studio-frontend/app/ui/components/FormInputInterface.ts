import { advancedSettingsI, chipGroupFieldsI, generalSettingsI, selectFieldsI } from "../../api/imagen-generate/generate-definitions";

export interface FormTextInputI {
  name: string;
  label: string;
  control:any;
  required: boolean;
}

export interface FormDropdownInputI {
  name: string;
  label: string;
  control:any;
  styleSize: string;
  width: string;
  setValue?: any;
  field: selectFieldsI;
  required: boolean;
}

export interface FormChipGroupInputI {
  name: string;
  label: string;
  control:any;
  width:string;
  mandatory:boolean;
  setValue?: any;
  field?: chipGroupFieldsI;
  required: boolean;
}

export interface FormInputGenerateSettingsI {
  control:any;
  setValue?: any;
  generalSettingsFields: generalSettingsI;
  advancedSettingsFields: advancedSettingsI;
}
