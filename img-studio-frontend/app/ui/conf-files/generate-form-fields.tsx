export const generateFields: generateFieldsInterface = {
  modelVersion: {
    type: 'select',
    default: 'imagen-3.0-fast-generate-001',
    options: [
      {
        value: 'imagen-3.0-generate-001',
        label: 'Imagen 3',
        indication: 'High performance model version',
      },
      {
        value: 'imagen-3.0-fast-generate-001',
        label: 'Imagen 3 - Fast',
        indication: 'Low latency model version',
      },
    ],
  },
  generalSettings: {
    label: 'General configuration',
    fields: {
      aspectRatio: {
        label: 'Aspect ratio',
        type: 'chip-group',
        default: '1:1',
        options: ['1:1', '9:16', '16:9', '3:4', '4:3'],
      },
      sampleCount: {
        label: 'Quantity of outputs',
        type: 'chip-group',
        default: '4',
        options: ['1', '2', '3', '4'],
      },
    },
  },
  advancedSettings: {
    label: 'Advanced generation configuration',
    fields: {
      personGeneration: {
        label: 'People generation',
        type: 'select',
        default: 'allow_all',
        options: [
          {
            value: 'allow_all',
            label: 'Allow all',
          },
          {
            value: 'allow_adult',
            label: 'Allow adult only',
          },
          {
            value: 'dont_allow',
            label: "Don't allow",
          },
        ],
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
      },
    },
  },
  style: {
    label: 'Setup a style for your image',
    fields: {
      img_style: {
        label: 'Primary style',
        type: 'select',
        default: 'photography high resolution',
        defaultSub: 'photographySub',
        options: [
          {
            value: 'photography high resolution',
            label: 'Photography',
            subID: 'photographySub',
          },
          {
            value: 'art creation',
            label: 'Art',
            subID: 'artSub',
          },
          {
            value: 'digital creation',
            label: 'Digital creation',
            subID: 'digitalSub',
          },
        ],
      },
      img_sub_style: {
        label: 'Secondary style',
        type: 'controled-chip-group',
        options: [
          {
            label: 'Photography style',
            subID: 'photographySub',
            type: 'chip-group',
            options: [
              'Landscape',
              'Studio',
              'Person portrait',
              'Black & White',
              'Vintage',
              'Polaroid',
              'Cinematic grain',
              'Candid',
              'Minimalist',
              'Long Exposure',
            ],
          },
          {
            label: 'Art style',
            subID: 'artSub',
            type: 'chip-group',
            options: [
              'Sketch',
              'Oil Painting',
              'Watercolor',
              'Pastel',
              'Ink',
              'Pop Art',
              'Cyberpunk',
              'Minimalism',
              'Street Art',
              'Cartoon',
              'Anime/Manga',
              'Graphic Novel',
            ],
          },
          {
            label: 'Digital creation style',
            subID: 'digitalSub',
            type: 'chip-group',
            options: ['Illustration', 'Pixel Art', 'Vector Art', '3D Rendering'],
          },
        ],
      },
    },
  },
  composition: {
    label: 'Advanced composition parameters',
    fields: {
      img_light: {
        label: 'Lightning',
        type: 'chip-group',
        options: ['Bright Sun', 'Golden Hour', 'Soft', 'Night time', 'Candle lit'],
      },
      img_light_origin: {
        label: 'Light origin',
        type: 'chip-group',
        options: ['Front', 'Top', 'Bottom', 'Left', 'Right', 'Behind'],
      },
      img_view_angle: {
        label: 'View angle',
        type: 'chip-group',
        options: ['Eye-level', 'Above', 'Bellow', 'Left', 'Right', 'Behind'],
      },
      img_perspective: {
        label: 'Perspective',
        type: 'chip-group',
        options: ['Medium wide', 'Wide', 'Extra wide', 'Close-up'],
      },
      img_background: {
        label: 'Background',
        type: 'chip-group',
        options: ['Blurry', 'Dark', 'Light'],
      },
    },
  },
}

export interface generateFieldsInterface {
  modelVersion: {
    type: string
    default: string
    options: {
      value: string
      label: string
      indication: string
    }[]
  }
  generalSettings: {
    label: string
    fields: {
      aspectRatio: {
        label: string
        type: string
        default: string
        options: string[]
      }
      sampleCount: {
        label: string
        type: string
        default: string
        options: string[]
      }
    }
  }
  advancedSettings: {
    label: string
    fields: {
      personGeneration: {
        label: string
        type: string
        default: string
        options: {
          value: string
          label: string
        }[]
      }
      outputOptions: {
        label: string
        type: string
        default: string
        options: {
          value: string
          label: string
        }[]
      }
    }
  }
  style: {
    label: string
    fields: {
      img_style: {
        label: string
        type: string
        default: string
        defaultSub: string
        options: {
          value: string
          label: string
          subID: string
        }[]
      }
      img_sub_style: {
        label: string
        type: string
        options: {
          label: string
          subID: string
          type: string
          options: string[]
        }[]
      }
    }
  }
  composition: {
    label: string
    fields: {
      img_light: {
        label: string
        type: string
        options: string[]
      }
      img_light_origin: {
        label: string
        type: string
        options: string[]
      }
      img_view_angle: {
        label: string
        type: string
        options: string[]
      }
      img_perspective: {
        label: string
        type: string
        options: string[]
      }
      img_background: {
        label: string
        type: string
        options: string[]
      }
    }
  }
}

export interface chipGroupFieldsInterface {
  label: string
  subID?: string
  type: string
  default?: string
  options: string[]
}
;[]

export interface selectFieldsInterface {
  label?: string
  type: string
  default: string
  options: {
    value: string
    label: string
    indication?: string
  }[]
}
;[]

export interface generalSettingsInterface {
  aspectRatio: chipGroupFieldsInterface
  sampleCount: chipGroupFieldsInterface
}

export interface advancedSettingsInterface {
  personGeneration: selectFieldsInterface
  outputOptions: selectFieldsInterface
}
