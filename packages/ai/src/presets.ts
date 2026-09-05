/** Slite-style Improve presets (acceptance §4 / PRD 4.2). */
export interface ImprovePreset {
  id: string
  labelZh: string
  labelEn: string
  instruction: string
}

export const IMPROVE_PRESETS: ImprovePreset[] = [
  {
    id: 'quick',
    labelZh: '一键优化',
    labelEn: 'Quick improve',
    instruction: 'Fix spelling and grammar, improve clarity and formatting in one pass.',
  },
  {
    id: 'grammar',
    labelZh: '修正拼写与语法',
    labelEn: 'Fix spelling & grammar',
    instruction: 'Fix spelling and grammar errors only. Change nothing else.',
  },
  {
    id: 'shorter',
    labelZh: '缩短',
    labelEn: 'Make shorter',
    instruction: 'Make the text significantly shorter while keeping all key information.',
  },
  {
    id: 'simplify',
    labelZh: '简化语言',
    labelEn: 'Simplify language',
    instruction: 'Rewrite in plain, simple language that is easy to skim.',
  },
  {
    id: 'tone-professional',
    labelZh: '语气：专业',
    labelEn: 'Tone: professional',
    instruction: 'Rewrite in a professional, business-like tone.',
  },
  {
    id: 'tone-friendly',
    labelZh: '语气：友好',
    labelEn: 'Tone: friendly',
    instruction: 'Rewrite in a warm, friendly tone.',
  },
  {
    id: 'formatting',
    labelZh: '优化排版',
    labelEn: 'Improve formatting',
    instruction: 'Improve structure and formatting: sentence breaks, ordering, parallel structure.',
  },
  {
    id: 'translate-en',
    labelZh: '翻译为英文',
    labelEn: 'Translate to English',
    instruction: 'Translate the text to English, preserving meaning and tone.',
  },
  {
    id: 'translate-zh',
    labelZh: '翻译为中文',
    labelEn: 'Translate to Chinese',
    instruction: 'Translate the text to Chinese (简体中文), preserving meaning and tone.',
  },
]
