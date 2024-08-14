import { advancedSettingsInterface, chipGroupFieldsInterface, generalSettingsInterface, selectFieldsInterface } from "../conf-files/generate-form-definitions";

export interface FormTextInputInterface {
  name: string;
  label: string;
  control:any;
  required: boolean;
}

export interface FormDropdownInputInterface {
  name: string;
  label: string;
  control:any;
  styleSize: string;
  width: string;
  setValue?: any;
  field: selectFieldsInterface;
  required: boolean;
}

export interface FormChipGroupInputInterface {
  name: string;
  label: string;
  control:any;
  width:string;
  mandatory:boolean;
  setValue?: any;
  field?: chipGroupFieldsInterface;
  required: boolean;
}

export interface FormInputGenerateSettingsInterface {
  control:any;
  setValue?: any;
  generalSettingsFields: generalSettingsInterface;
  advancedSettingsFields: advancedSettingsInterface;
}
