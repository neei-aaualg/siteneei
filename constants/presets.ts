import type { PresetIcon, QRCodeCardItem } from '../types/qrcode'

// Helper to convert SVG string to data URI
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Crisp Vector SVGs for central logos
export const SVG_ICONS = {
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="23" fill="#25D366"/>
    <path fill="#ffffff" d="M34.8 28.5c-.5-.2-2.9-1.4-3.4-1.6-.4-.2-.8-.2-1.1.3-.3.5-1.3 1.6-1.5 1.9-.3.3-.6.3-1.1.1-.5-.2-2.1-.8-4-2.5-1.5-1.3-2.5-3-2.8-3.5-.3-.5 0-.8.2-1 .2-.2.5-.6.8-.9.2-.3.3-.5.5-.9.1-.3 0-.7-.1-.9s-1.1-2.7-1.5-3.6c-.4-.9-.8-.8-1.1-.8h-1c-.3 0-.9.1-1.4.6-.5.5-1.9 1.9-1.9 4.6 0 2.7 2 5.3 2.3 5.6.3.4 3.9 6 9.4 8.4 1.3.6 2.3.9 3.1 1.2 1.3.4 2.5.3 3.4.2 1-.1 3.1-1.3 3.5-2.5.4-1.2.4-2.3.3-2.5-.1-.2-.5-.3-1-.5z"/>
  </svg>`,

  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <defs>
      <radialGradient id="igG" cx="20%" cy="110%" r="130%">
        <stop offset="0%" stop-color="#FFDD55"/>
        <stop offset="25%" stop-color="#FF543E"/>
        <stop offset="50%" stop-color="#C837AB"/>
        <stop offset="100%" stop-color="#3771C8"/>
      </radialGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#igG)"/>
    <rect x="9" y="9" width="30" height="30" rx="9" fill="none" stroke="#ffffff" stroke-width="3.2"/>
    <circle cx="24" cy="24" r="7.5" fill="none" stroke="#ffffff" stroke-width="3.2"/>
    <circle cx="31.8" cy="16.2" r="2.2" fill="#ffffff"/>
  </svg>`,

  discord: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#5865F2"/>
    <path fill="#ffffff" d="M35.6 13.5c-2.4-1.1-5-1.9-7.7-2.1-.3.6-.7 1.4-1 2-2.9-.4-5.8-.4-8.7 0-.3-.6-.7-1.4-1-2-2.7.2-5.3 1-7.7 2.1-4.8 7.2-6.1 14.1-5.5 21 3.2 2.4 6.3 3.8 9.3 4.7.7-1 1.4-2.1 2-3.2-1.1-.4-2.1-.9-3.1-1.6.3-.2.5-.4.8-.6 6.1 2.8 12.7 2.8 18.7 0 .3.2.5.4.8.6-1 .6-2 1.2-3.1 1.6.6 1.1 1.3 2.2 2 3.2 3-.9 6.1-2.4 9.3-4.7.7-7.9-.7-14.8-5.5-21zM18.8 28.5c-1.8 0-3.3-1.6-3.3-3.7 0-2 1.4-3.7 3.3-3.7 1.9 0 3.3 1.7 3.3 3.7 0 2-1.4 3.7-3.3 3.7zm10.4 0c-1.8 0-3.3-1.6-3.3-3.7 0-2 1.5-3.7 3.3-3.7 1.9 0 3.3 1.7 3.3 3.7 0 2-1.4 3.7-3.3 3.7z"/>
  </svg>`,

  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#FF0000"/>
    <path fill="#ffffff" d="M38.5 17.2c-.4-1.6-1.7-2.9-3.3-3.3C32.3 13 24 13 24 13s-8.3 0-11.2.9c-1.6.4-2.9 1.7-3.3 3.3C8.6 20.1 8.6 24 8.6 24s0 3.9.9 6.8c.4 1.6 1.7 2.9 3.3 3.3 2.9.9 11.2.9 11.2.9s8.3 0 11.2-.9c1.6-.4 2.9-1.7 3.3-3.3.9-2.9.9-6.8.9-6.8s0-3.9-.9-6.8zM20.8 28.7v-9.4l8.2 4.7-8.2 4.7z"/>
  </svg>`,

  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#0A66C2"/>
    <path fill="#ffffff" d="M14.5 18.2h5.1V34h-5.1V18.2zM17 11c1.6 0 2.9 1.3 2.9 2.9 0 1.6-1.3 2.9-2.9 2.9-1.6 0-2.9-1.3-2.9-2.9C14.1 12.3 15.4 11 17 11zm6.3 7.2h4.9v2.2h.1c.7-1.3 2.4-2.6 4.9-2.6 5.2 0 6.2 3.4 6.2 7.9V34h-5.1v-7.3c0-1.7 0-4-2.4-4s-2.8 1.9-2.8 3.8V34h-5.1V18.2z"/>
  </svg>`,

  x_twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#000000"/>
    <path fill="#ffffff" d="M28.7 13h4.3l-9.4 10.7 11.1 14.6h-8.7l-6.8-8.9-7.8 8.9H7l10-11.4L6.3 13h8.9l6.2 8.1L28.7 13zm-1.5 22.8h2.4L14.7 15.4h-2.6l15.1 20.4z"/>
  </svg>`,

  wifi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#0284C7"/>
    <path fill="#ffffff" d="M24 33a3 3 0 100 6 3 3 0 000-6zm-7.8-5.8c2.1-2.1 5-3.2 7.8-3.2s5.7 1.1 7.8 3.2l2.1-2.1c-2.7-2.7-6.3-4.1-9.9-4.1s-7.2 1.4-9.9 4.1l2.1 2.1zm-4.2-4.2c3.2-3.2 7.5-5 12-5s8.8 1.8 12 5l2.1-2.1c-3.8-3.8-8.8-5.9-14.1-5.9s-10.3 2.1-14.1 5.9l2.1 2.1z"/>
  </svg>`,

  globe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#4F46E5"/>
    <path fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M24 10a14 14 0 100 28 14 14 0 000-28zm0 0c-3.5 0-6.5 6.3-6.5 14s3 14 6.5 14 6.5-6.3 6.5-14-3-14-6.5-14zm-13.5 14h27"/>
  </svg>`,

  mail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#EA580C"/>
    <path fill="#ffffff" d="M36 15H12c-1.7 0-3 1.3-3 3v14c0 1.7 1.3 3 3 3h24c1.7 0 3-1.3 3-3V18c0-1.7-1.3-3-3-3zm-.6 4L24 26.1 12.6 19h22.8zM12 32V21.4l11.4 7.1c.4.2.8.2 1.2 0L36 21.4V32H12z"/>
  </svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="12" fill="#EAB308"/>
    <path fill="#ffffff" d="M24 12l3.7 7.5 8.3 1.2-6 5.8 1.4 8.2-7.4-3.9-7.4 3.9 1.4-8.2-6-5.8 8.3-1.2L24 12z"/>
  </svg>`
}

export const PRESET_ICONS: PresetIcon[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    svgDataUri: svgToDataUri(SVG_ICONS.whatsapp),
    defaultDotColor: '#128C7E',
    defaultBgColor: '#FFFFFF',
    category: 'whatsapp'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    svgDataUri: svgToDataUri(SVG_ICONS.instagram),
    defaultDotColor: '#C13584',
    defaultBgColor: '#FFFFFF',
    category: 'instagram'
  },
  {
    id: 'discord',
    name: 'Discord',
    svgDataUri: svgToDataUri(SVG_ICONS.discord),
    defaultDotColor: '#5865F2',
    defaultBgColor: '#FFFFFF',
    category: 'discord'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    svgDataUri: svgToDataUri(SVG_ICONS.youtube),
    defaultDotColor: '#CC0000',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    svgDataUri: svgToDataUri(SVG_ICONS.linkedin),
    defaultDotColor: '#0A66C2',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter)',
    svgDataUri: svgToDataUri(SVG_ICONS.x_twitter),
    defaultDotColor: '#0f1419',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  },
  {
    id: 'wifi',
    name: 'Rede Wi-Fi',
    svgDataUri: svgToDataUri(SVG_ICONS.wifi),
    defaultDotColor: '#0284C7',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  },
  {
    id: 'globe',
    name: 'Website / Link',
    svgDataUri: svgToDataUri(SVG_ICONS.globe),
    defaultDotColor: '#4338CA',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  },
  {
    id: 'mail',
    name: 'Email / Contacto',
    svgDataUri: svgToDataUri(SVG_ICONS.mail),
    defaultDotColor: '#C2410C',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  },
  {
    id: 'star',
    name: 'Avaliação / VIP',
    svgDataUri: svgToDataUri(SVG_ICONS.star),
    defaultDotColor: '#B45309',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  },
  {
    id: 'neei',
    name: 'NEEI UAlg',
    svgDataUri: '/neei-logo.png',
    defaultDotColor: '#00668c',
    defaultBgColor: '#FFFFFF',
    category: 'custom'
  }
]

// Default 3 initial cards required by user
export const DEFAULT_INITIAL_CARDS: QRCodeCardItem[] = [
  {
    id: 'card-whatsapp',
    title: 'WhatsApp Oficial',
    category: 'whatsapp',
    url: 'https://wa.me/351912345678',
    logoUrl: svgToDataUri(SVG_ICONS.whatsapp),
    logoPresetId: 'whatsapp',
    logoMargin: 6,
    logoSize: 0.32,
    dotColor: '#075E54',
    bgColor: '#FFFFFF',
    isTransparentBg: false,
    dotType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    cornerSquareColor: '#128C7E',
    cornerDotColor: '#25D366',
    errorCorrectionLevel: 'H',
    whatsappPhone: '351912345678',
    whatsappMessage: '',
    themeName: 'whatsapp'
  },
  {
    id: 'card-instagram',
    title: 'Instagram @empresa',
    category: 'instagram',
    url: 'https://instagram.com/empresa',
    logoUrl: svgToDataUri(SVG_ICONS.instagram),
    logoPresetId: 'instagram',
    logoMargin: 6,
    logoSize: 0.32,
    dotColor: '#833AB4',
    bgColor: '#FFFFFF',
    isTransparentBg: false,
    dotType: 'classy-rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    cornerSquareColor: '#C13584',
    cornerDotColor: '#FD1D1D',
    errorCorrectionLevel: 'H',
    instagramHandle: 'empresa',
    themeName: 'instagram'
  },
  {
    id: 'card-discord',
    title: 'Discord Comunidade',
    category: 'discord',
    url: 'https://discord.gg/comunidade',
    logoUrl: svgToDataUri(SVG_ICONS.discord),
    logoPresetId: 'discord',
    logoMargin: 6,
    logoSize: 0.32,
    dotColor: '#404EED',
    bgColor: '#FFFFFF',
    isTransparentBg: false,
    dotType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    cornerSquareColor: '#5865F2',
    cornerDotColor: '#5865F2',
    errorCorrectionLevel: 'H',
    discordInvite: 'comunidade',
    themeName: 'discord'
  }
]
