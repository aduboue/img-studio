export const generateFields = {
  prompt: {
    type: 'textInput',
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
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
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  sampleCount: {
    label: 'Quantity of outputs',
    type: 'chip-group',
    default: '4',
    options: ['1', '2', '3', '4'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  negativePrompt: {
    type: 'textInput',
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  aspectRatio: {
    label: 'Aspect ratio',
    type: 'chip-group',
    default: '1:1',
    options: ['1:1', '9:16', '16:9', '3:4', '4:3'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  personGeneration: {
    label: 'People generation',
    type: 'select',
    default: 'allow_adult',
    options: [
      {
        value: 'allow_adult',
        label: 'Allow adult only',
      },
      {
        value: 'dont_allow',
        label: "Don't allow",
      },
    ],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
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
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  style: {
    type: 'select',
    default: 'highly realistic DSLR photography in high resolution',
    defaultSub: 'photographySub',
    options: [
      {
        value: 'highly realistic DSLR photography in high resolution',
        label: 'Photography',
        subID: 'photographySub',
      },
      {
        value: 'manual art creation',
        label: 'Art',
        subID: 'artSub',
      },
      {
        value: 'computer digital creation',
        label: 'Digital creation',
        subID: 'digitalSub',
      },
    ],
    isDataResetable: false,
    isFullPromptAdditionalField: true,
  },
  secondary_style: {
    type: 'controled-chip-group',
    options: [
      {
        label: 'Photography style',
        subID: 'photographySub',
        type: 'select',
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
        default: '',
      },
      {
        label: 'Art style',
        subID: 'artSub',
        type: 'select',
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
        default: '',
      },
      {
        label: 'Digital creation style',
        subID: 'digitalSub',
        type: 'select',
        options: ['Illustration', 'Pixel Art', 'Vector Art', '3D Rendering'],
        default: '',
      },
    ],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  light: {
    label: 'Lightning',
    type: 'chip-group',
    options: ['Bright Sun', 'Golden Hour', 'Soft', 'Night time', 'Candle lit'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  light_coming_from: {
    label: 'Light origin',
    type: 'chip-group',
    options: ['Front', 'Back', 'Above', 'Below', 'Left', 'Right'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  shot_from: {
    label: 'View angle',
    type: 'chip-group',
    options: ['Front', 'Back', 'Above', 'Below', 'Left', 'Right'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  perspective: {
    label: 'Perspective',
    type: 'chip-group',
    options: ['Medium wide', 'Wide', 'Extra wide', 'Close-up'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  background_color: {
    label: 'Background',
    type: 'chip-group',
    options: ['Colorful', 'Light', 'Dark'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
}

interface I1 {
  label?: string
  type?: string
  default?: string
  options?:
    | string[]
    | {
        value: string
        label: string
        indication?: string
        type?: string
      }[]
  isDataResetable: boolean
  isFullPromptAdditionalField: boolean
}

interface I2 {
  type: string
  default?: string
  defaultSub?: string
  options: {
    label: string
    type: string
    subID: string
    options?: string[]
    default: string
  }[]
  isDataResetable: boolean
  isFullPromptAdditionalField: boolean
}

export interface generateFieldsI {
  prompt: I1
  modelVersion: I1
  sampleCount: I1
  negativePrompt: I1
  aspectRatio: I1
  personGeneration: I1
  outputOptions: I1
  style: I2
  secondary_style: I2
  light: I1
  light_coming_from: I1
  shot_from: I1
  perspective: I1
  background_color: I1
}

export interface chipGroupFieldsI {
  label: string
  subID?: string
  default?: string
  options: string[]
}
;[]

export interface selectFieldsI {
  label?: string
  default: string
  options: {
    value: string
    label: string
    indication?: string
  }[]
}
;[]

export interface generalSettingsI {
  aspectRatio: chipGroupFieldsI
  sampleCount: chipGroupFieldsI
}

export interface advancedSettingsI {
  personGeneration: selectFieldsI
  outputOptions: selectFieldsI
}

//TODO automatically populate general, advanced, composition
export const modelField = generateFields.modelVersion
export const generalSettingsFields = {
  aspectRatio: generateFields.aspectRatio,
  sampleCount: generateFields.sampleCount,
}
export const advancedSettingsFields = {
  personGeneration: generateFields.personGeneration,
  outputOptions: generateFields.outputOptions,
}
export const imgStyleField = generateFields.style

export const subImgStyleFields = generateFields.secondary_style

export const compositionFields = {
  light: generateFields.light,
  light_coming_from: generateFields.light_coming_from,
  shot_from: generateFields.shot_from,
  perspective: generateFields.perspective,
  background_color: generateFields.background_color,
}

export interface formDataI {
  prompt: string
  modelVersion: string
  sampleCount: string
  negativePrompt: string
  aspectRatio: string
  personGeneration: string
  outputOptions: string
  style: string
  secondary_style: string
  light: string
  light_coming_from: string
  shot_from: string
  perspective: string
  background_color: string
}

const generateFieldList: [keyof generateFieldsI] = Object.keys(generateFields) as [keyof generateFieldsI]

export var formDataDefaults: any

generateFieldList.forEach((field) => {
  const fieldParams: I1 | I2 = generateFields[field]
  const defaultValue = 'default' in fieldParams ? fieldParams.default : ''
  formDataDefaults = { ...formDataDefaults, [field]: defaultValue }
})

export const formDataResetableFields = generateFieldList.filter(
  (field) => generateFields[field].isDataResetable == true
)

export const fullPromptAdditionalFields = generateFieldList.filter(
  (field) => generateFields[field].isFullPromptAdditionalField == true
)

import { z } from 'zod'

export const GenerateFormSchema: z.ZodType<formDataI> = z.object({
  prompt: z.string(),
  modelVersion: z.enum(generateFields.modelVersion.options.map((option) => option.value) as [string, ...string[]]),
  sampleCount: z.enum(generateFields.sampleCount.options as [string, ...string[]]),
  negativePrompt: z.string(),
  aspectRatio: z.enum(generateFields.aspectRatio.options as [string, ...string[]]),
  personGeneration: z.enum(
    generateFields.personGeneration.options.map((option) => option.value) as [string, ...string[]]
  ),
  outputOptions: z.enum(generateFields.outputOptions.options.map((option) => option.value) as [string, ...string[]]),
  style: z.enum(generateFields.style.options.map((option) => option.value) as [string, ...string[]]),
  secondary_style: z.enum(
    generateFields.secondary_style.options.map((subStyle) => subStyle.options).flat(1) as [string, ...string[]]
  ),
  light: z.enum(generateFields.light.options as [string, ...string[]]),
  light_coming_from: z.enum(generateFields.light_coming_from.options as [string, ...string[]]),
  shot_from: z.enum(generateFields.shot_from.options as [string, ...string[]]),
  perspective: z.enum(generateFields.perspective.options as [string, ...string[]]),
  background_color: z.enum(generateFields.background_color.options as [string, ...string[]]),
})

export interface GeneratedImagesInGCSI {
  gcsUri: string
  mimeType: string
}

export interface ImageI {
  src: string
  gcsUri: string
  ratio: string
  width: number
  height: number
  altText: string
  key: string
  type: string
}

export const RatioToPixel = [
  { ratio: '1:1', width: 1024, height: 1024 },
  { ratio: '9:16', width: 768, height: 1408 },
  { ratio: '16:9', width: 1408, height: 768 },
  { ratio: '3:4', width: 896, height: 1280 },
  { ratio: '4:3', width: 1280, height: 896 },
]

export const RandomPrompts = [
  'Shot in the style of DSLR camera with the polarizing filter. A photo of two hot air balloons floating over the unique rock formations in Cappadocia, Turkey. The colors and patterns on these balloons contrast beautifully against the earthy tones of the landscape. below. This shot captures the sense of adventure that comes with enjoying such an experience.',
  'Close-up photo of an origami bird soaring through a cityscape, in a flock with others of different colors and patterns, casting intricate shadows on the buildings below.',
  'Three women stand together laughing, with one woman slightly out of focus in the foreground. The sun is setting behind the women, creating a lens flare and a warm glow that highlights their hair and creates a bokeh effect in the background. The photography style is candid and captures a genuine moment of connection and happiness between friends. The warm light of golden hour lends a nostalgic and intimate feel to the image.',
  'A weathered, wooden mech robot covered in flowering vines stands peacefully in a field of tall wildflowers, with a small bluebird resting on its outstretched hand. Digital cartoon, with warm colors and soft lines. A large cliff with a waterfall looms behind.',
  'Photographic portrait of a real life dragon resting peacefully in a zoo, curled up next to its pet sheep. Cinematic movie still, high quality DSLR photo.',
  "A view of a person's hand holding a eucalyptus sprig a macro DSLR image highlighting the balance of human and nature.",
  'A large, colorful bouquet of flowers in an old blue glass vase on the table. In front is one beautiful peony flower surrounded by various other blossoms like roses, lilies, daisies, orchids, fruits, berries, green leaves. The background is dark gray. Oil painting in the style of the Dutch Golden Age.',
  'Detailed illustration of majestic lion roaring proudly in a dream-like jungle, purple white line art background, clipart on light violet paper texture',
  'Claymation scene. A medium wide shot of an elderly woman. She is wearing flowing clothing. She is standing in a lush garden watering the plants with an orange watering can',
  'Elephant amigurumi walking in savanna, a professional photograph, blurry background',
  "A view of a person's hand as they hold a little clay figurine of a bird in their hand and sculpt it with a modeling tool in their other hand. You can see the sculptor's scarf. Their hands are covered in clay dust. a macro DSLR image highlighting the texture and craftsmanship.",
  "White fluffy bear toy is sleeping in a children's room, on the floor of a baby bedroom with toy boxes and toys around, in the style of photorealistic 3D rendering.",
  "Word 'light' made from various colorful feathers, black background",
  "A single comic book panel of an old dog and an adult man on a grassy hill, staring at the sunset. A speech bubble points from the man's mouth and says: 'The sun will rise again'. Muted, late 1990s coloring style",
  "A photograph of a stately library entrance with the words 'Central Library' carved into the stone",
]
