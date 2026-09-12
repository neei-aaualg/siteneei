export type DotType = 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'
export type CornerSquareType = 'dot' | 'square' | 'extra-rounded'
export type CornerDotType = 'dot' | 'square'
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QRCodeCardItem {
  id: string
  title: string
  category: 'whatsapp' | 'instagram' | 'discord' | 'custom' | 'wifi' | 'url'
  url: string
  // Logo
  logoUrl: string | null
  logoPresetId: string | null
  logoMargin: number // pixels around logo (0 - 25)
  logoSize: number // ratio (0.15 to 0.40)
  // Styling
  dotColor: string
  bgColor: string
  isTransparentBg: boolean
  dotType: DotType
  cornerSquareType: CornerSquareType
  cornerDotType: CornerDotType
  cornerSquareColor: string
  cornerDotColor: string
  errorCorrectionLevel: ErrorCorrectionLevel
  // Helpers
  whatsappPhone?: string
  whatsappMessage?: string
  instagramHandle?: string
  discordInvite?: string
  // Visual Theme identifier
  themeName?: string
}

export interface PresetIcon {
  id: string
  name: string
  svgDataUri: string
  defaultDotColor: string
  defaultBgColor: string
  category: 'whatsapp' | 'instagram' | 'discord' | 'custom'
}
