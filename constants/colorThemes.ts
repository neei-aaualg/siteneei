export interface ColorTheme {
  id: string
  name: string
  dotColor: string
  bgColor: string
  cornerSquareColor: string
  cornerDotColor: string
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'classic-black',
    name: 'Clássico Preto',
    dotColor: '#000000',
    bgColor: '#FFFFFF',
    cornerSquareColor: '#000000',
    cornerDotColor: '#000000'
  },
  {
    id: 'emerald-tech',
    name: 'Esmeralda Tech',
    dotColor: '#047857',
    bgColor: '#FFFFFF',
    cornerSquareColor: '#065F46',
    cornerDotColor: '#10B981'
  },
  {
    id: 'royal-sapphire',
    name: 'Safira Real',
    dotColor: '#1D4ED8',
    bgColor: '#FFFFFF',
    cornerSquareColor: '#1E40AF',
    cornerDotColor: '#3B82F6'
  },
  {
    id: 'cyber-violet',
    name: 'Violeta Cyber',
    dotColor: '#6D28D9',
    bgColor: '#FFFFFF',
    cornerSquareColor: '#5B21B6',
    cornerDotColor: '#8B5CF6'
  },
  {
    id: 'sunset-amber',
    name: 'Âmbar Pôr do Sol',
    dotColor: '#B45309',
    bgColor: '#FFFFFF',
    cornerSquareColor: '#92400E',
    cornerDotColor: '#F59E0B'
  },
  {
    id: 'ruby-crimson',
    name: 'Rubi Carmesim',
    dotColor: '#BE123C',
    bgColor: '#FFFFFF',
    cornerSquareColor: '#9F1239',
    cornerDotColor: '#F43F5E'
  },
  {
    id: 'dark-obsidian',
    name: 'Obsidiana Escura',
    dotColor: '#38BDF8',
    bgColor: '#0F172A',
    cornerSquareColor: '#0EA5E9',
    cornerDotColor: '#38BDF8'
  },
  {
    id: 'neon-matrix',
    name: 'Neon Matrix',
    dotColor: '#22C55E',
    bgColor: '#052E16',
    cornerSquareColor: '#16A34A',
    cornerDotColor: '#4ADE80'
  }
]
