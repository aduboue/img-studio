interface GenerateImagFieldI1 {
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
interface GenerateImagFieldStyleI {
  type: string
  default: string
  defaultSub: string
  options: {
    value: string
    label: string
    subID: string
  }[]
  isDataResetable: boolean
  isFullPromptAdditionalField: boolean
}

interface GenerateImagFieldSecondartStyleI {
  type: string
  options: {
    label: string
    subID: string
    type: string
    options: string[]
    default: string
  }[]
  isDataResetable: boolean
  isFullPromptAdditionalField: boolean
}

export interface GenerateImageFormFieldsI {
  prompt: GenerateImagFieldI1
  modelVersion: GenerateImagFieldI1
  sampleCount: GenerateImagFieldI1
  negativePrompt: GenerateImagFieldI1
  aspectRatio: GenerateImagFieldI1
  personGeneration: GenerateImagFieldI1
  outputOptions: GenerateImagFieldI1
  style: GenerateImagFieldStyleI
  secondary_style: GenerateImagFieldSecondartStyleI
  light: GenerateImagFieldI1
  light_coming_from: GenerateImagFieldI1
  shot_from: GenerateImagFieldI1
  perspective: GenerateImagFieldI1
  colors: GenerateImagFieldI1
  //use_Case: GenerateImagFieldI1
}

export const GenerateImageFormFields = {
  prompt: {
    type: 'textInput',
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  modelVersion: {
    type: 'select',
    default: 'imagen-3.0-generate-001',
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
    default: 'photo',
    defaultSub: 'photographySub',
    options: [
      {
        value: 'photo',
        label: 'Photography',
        subID: 'photographySub',
      },
      {
        value: 'drawing',
        label: 'Drawing',
        subID: 'drawingSub',
      },
      {
        value: 'painting',
        label: 'Painting',
        subID: 'paintingSub',
      },
      {
        value: 'computer digital creation',
        label: 'Digital art',
        subID: 'digitalSub',
      },
    ],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
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
          'Portrait',
          'Candid',
          'Street',
          'Architectural',
          'Wildlife',
          'Photojournalism',
          'Fashion',
          'Food',
          'Travel',
          'Fine Art',
          'Polaroid',
          'Astronomy',
        ],
        default: '',
      },
      {
        label: 'Drawing style',
        subID: 'drawingSub',
        type: 'select',
        options: [
          'Technical pencil',
          'Color pencil',
          'Cartoon',
          'Graphic Novel',
          'Charcoal',
          'Pastel',
          'Ink',
          'Sketch',
          'Doodle',
        ],
        default: '',
      },
      {
        label: 'Painting style',
        subID: 'paintingSub',
        type: 'select',
        options: [
          'Gouache',
          'Oil',
          'Watercolor',
          'Pastel',
          'Street Art',
          'Impressionism',
          'Expressionism',
          'Surrealism',
          'Abstract',
          'Minimalism',
        ],
        default: '',
      },
      {
        label: 'Digital creation style',
        subID: 'digitalSub',
        type: 'select',
        options: [
          'Typography',
          'Digital illustration',
          'Pop Art',
          'Cyberpunk poster',
          'Pixel Art',
          'Vector Art',
          '3D Rendering',
          'Video game',
          'Animation',
          'Visual Effects',
          'Motion Graphics',
        ],
        default: '',
      },
    ],
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  light: {
    label: 'Lightning',
    type: 'chip-group',
    options: ['Natural', 'Bright Sun', 'Golden Hour', 'Night time', 'Dramatic', 'Warm', 'Cold'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  light_coming_from: {
    label: 'Light origin',
    type: 'chip-group',
    options: ['Front', 'Back', 'Above', 'Below', 'Side'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  shot_from: {
    label: 'View angle',
    type: 'chip-group',
    options: ['Front', 'Back', 'Above', 'Below', 'Side'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  perspective: {
    label: 'Perspective',
    type: 'chip-group',
    options: ['Macro', 'Close-up', 'Standard', 'Wide angle', 'Extra wide', 'Aerial'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  colors: {
    label: 'Colors',
    type: 'chip-group',
    options: ['Colorful', 'Light', 'Dark', 'Black & White', 'Vintage', 'Cinematic grain'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
}

export interface chipGroupFieldsI {
  label: string
  subID?: string
  default?: string | number
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

// Sort out Generate fields depending on purpose
export const modelField = GenerateImageFormFields.modelVersion
export const generalSettingsFields = {
  aspectRatio: GenerateImageFormFields.aspectRatio,
  sampleCount: GenerateImageFormFields.sampleCount,
}
export const advancedSettingsFields = {
  personGeneration: GenerateImageFormFields.personGeneration,
  outputOptions: GenerateImageFormFields.outputOptions,
}
export const imgStyleField = GenerateImageFormFields.style
export const subImgStyleFields = GenerateImageFormFields.secondary_style
export const compositionFields = {
  light: GenerateImageFormFields.light,
  light_coming_from: GenerateImageFormFields.light_coming_from,
  shot_from: GenerateImageFormFields.shot_from,
  perspective: GenerateImageFormFields.perspective,
  colors: GenerateImageFormFields.colors,
  //use_case: GenerateImageFormFields.use_Case,
}

// Interface of Generate form fields
export interface GenerateImageFormI {
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
  colors: string
  use_Case: string
}

// Set default values for Generate Form
const generateFieldList: [keyof GenerateImageFormFieldsI] = Object.keys(GenerateImageFormFields) as [
  keyof GenerateImageFormFieldsI
]
export var formDataDefaults: any
generateFieldList.forEach((field) => {
  const fieldParams: GenerateImagFieldI1 | GenerateImagFieldStyleI | GenerateImagFieldSecondartStyleI =
    GenerateImageFormFields[field]
  const defaultValue = 'default' in fieldParams ? fieldParams.default : ''
  formDataDefaults = { ...formDataDefaults, [field]: defaultValue }
})

// Set fields that can be reseted by the user
export const formDataResetableFields = generateFieldList.filter(
  (field) => GenerateImageFormFields[field].isDataResetable == true
)

// Set fields that are used to complete the prompt written by the user
export const fullPromptAdditionalFields = generateFieldList.filter(
  (field) => GenerateImageFormFields[field].isFullPromptAdditionalField == true
)

// Interface of result sent back by Imagen
export interface VisionGenerativeModelResultI {
  gcsUri: string
  mimeType: string
}

// Interface of Image object created after image generation
export interface ImageI {
  src: string
  gcsUri: string
  ratio: string
  width: number
  height: number
  altText: string
  key: string
  format: string
  prompt: string
  date: string
  author: string
  modelVersion: string
  mode: string
}

// List of Imagen available ratio and their corresponding generation dimentions
export const RatioToPixel = [
  { ratio: '1:1', width: 1024, height: 1024 },
  { ratio: '9:16', width: 768, height: 1408 },
  { ratio: '16:9', width: 1408, height: 768 },
  { ratio: '3:4', width: 896, height: 1280 },
  { ratio: '4:3', width: 1280, height: 896 },
]

// List of Imagen upscaling options
export const UpscaleToPixel = [
  { upscale: 'no', width: 1024, height: 1024 },
  { upscale: 'x2', width: 2048, height: 2048 },
  { upscale: 'x4', width: 4096, height: 4096 },
]

// Random prompt list the user can use if they lack prompt ideas
export const RandomPrompts = [
  'A woman hiking, close of her boots reflected in a puddle, large mountains in the background, in the style of an advertisement, dramatic angles',
  'Three women stand together laughing, with one woman slightly out of focus in the foreground. The sun is setting behind the women, creating a lens flare and a warm glow that highlights their hair and creates a bokeh effect in the background. The photography style is candid and captures a genuine moment of connection and happiness between friends. The warm light of golden hour lends a nostalgic and intimate feel to the image',
  'A weathered, wooden mech robot covered in flowering vines stands peacefully in a field of tall wildflowers, with a small bluebird resting on its outstretched hand. Digital cartoon, with warm colors and soft lines. A large cliff with a waterfall looms behind',
  'A real life dragon resting peacefully in a zoo, curled up next to its pet sheep. Cinematic movie still, high quality DSLR photo',
  'A large, colorful bouquet of flowers in an old blue glass vase on the table. In front is one beautiful peony flower surrounded by various other blossoms like roses, lilies, daisies, orchids, fruits, berries, green leaves. The background is dark gray. Oil painting in the style of the Dutch Golden Age',
  'Claymation scene. A medium wide shot of an elderly woman. She is wearing flowing clothing. She is standing in a lush garden watering the plants with an orange watering can',
  "A view of a person's hand as they hold a little clay figurine of a bird in their hand and sculpt it with a modeling tool in their other hand. You can see the sculptor's scarf. Their hands are covered in clay dust. a macro DSLR image highlighting the texture and craftsmanship",
  "White fluffy bear toy is sleeping in a children's room, on the floor of a baby bedroom with toy boxes and toys around, in the style of photorealistic 3D rendering",
  'A professional studio photo of french fries for a high end restaurant, in the style of a food magazine',
  "A single comic book panel of an old dog and an adult man on a grassy hill, staring at the sunset. A speech bubble points from the man's mouth and says: 'The sun will rise again'. Muted, late 1990s coloring style",
  "A photograph of a stately library entrance with the words 'Central Library' carved into the stone",
  'A close up of a  warm and fuzzy colorful Peruvian poncho laying on a top of a chair in a bright day',
  "Close up of a musician's fingers playing the piano, black and white film, vintage",
  'Close up shot, In a dimly lit jazz club, a soulful saxophone player, their face contorted in concentration, pours their heart out through their music. A small group of people listen intently, feeling every emotion',
  'Aerial shot of a river flowing up a mystical valley',
  'A sketch of a modern apartment building (subject) surrounded by skyscrapers',
  'Close up photo of a woman in her 20s, street photography, canon, movie still, muted orange warm tones',
  'A photo of a modern building with water in the background',
  'A photo of a chocolate bar on a kitchen counter',
  'An charcoal drawing of an angular sporty electric sedan with skyscrapers in the background',
  'A photo of a forest canopy with blue skies from below',
  'A studio photo of a modern arm chair, dramatic lighting',
  'Soft focus photograph of a bridge in an urban city at night',
  'Photo of a city with skyscrapers from the inside of a car with motion blur',
  'Photo of a leaf, macro lens',
  'A wind farm in the style of a renaissance painting',
  'A man wearing all white clothing sitting on the beach, close up, golden hour lighting',
  'A digital render of a massive skyscraper, modern, grand, epic with a beautiful sunset in the background',
  '4K video game concept art, urban jungle, cyberpunk city, detailed rendering',
  'A woman, 35mm portrait, blue and grey duotones',
  'A plate of pasta, 100mm Macro lens',
  'A winning touchdown, fast shutter speed, movement tracking',
  'A deer running in the forest, fast shutter speed, movement tracking',
  'A photo of the moon, astro photography, wide angle 10mm',
]
