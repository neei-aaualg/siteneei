import QRCodeStyling from 'qr-code-styling'
import JSZip from 'jszip'
import type { QRCodeCardItem } from '../types/qrcode'

export function createQRCodeStylingInstance(item: QRCodeCardItem, size = 1000): QRCodeStyling {
  return new QRCodeStyling({
    width: size,
    height: size,
    type: 'svg',
    data: item.url || 'https://google.com',
    image: item.logoUrl || undefined,
    margin: 16,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: 'H' // Always Level H (30% tolerance)
    },
    imageOptions: {
      hideBackgroundDots: true, // Cleans modules under logo so it doesn't overlap blindly
      imageSize: item.logoSize,
      margin: item.logoMargin,
      crossOrigin: 'anonymous',
      saveAsBlob: true
    },
    dotsOptions: {
      color: item.dotColor || '#000000',
      type: item.dotType || 'rounded'
    },
    backgroundOptions: {
      color: item.isTransparentBg ? 'transparent' : (item.bgColor || '#ffffff')
    },
    cornersSquareOptions: {
      color: item.cornerSquareColor || item.dotColor || '#000000',
      type: item.cornerSquareType || 'extra-rounded'
    },
    cornersDotOptions: {
      color: item.cornerDotColor || item.dotColor || '#000000',
      type: item.cornerDotType || 'dot'
    }
  })
}

// Download single card as SVG
export async function downloadCardSvg(item: QRCodeCardItem): Promise<void> {
  const qr = createQRCodeStylingInstance(item, 1200)
  const safeTitle = (item.title || 'qrcode').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
  await qr.download({
    name: safeTitle,
    extension: 'svg'
  })
}

// Download single card as PNG (High Res 2048px)
export async function downloadCardPng(item: QRCodeCardItem): Promise<void> {
  const qr = createQRCodeStylingInstance(item, 2048)
  const safeTitle = (item.title || 'qrcode').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
  await qr.download({
    name: safeTitle,
    extension: 'png'
  })
}

// Copy SVG string to clipboard
export async function copyCardSvgToClipboard(item: QRCodeCardItem): Promise<boolean> {
  try {
    const qr = createQRCodeStylingInstance(item, 1000)
    const rawData = await qr.getRawData('svg')
    if (!rawData) return false
    const svgBlob = rawData instanceof Blob ? rawData : new Blob([rawData as unknown as BlobPart], { type: 'image/svg+xml' })
    const svgText = await svgBlob.text()
    await navigator.clipboard.writeText(svgText)
    return true
  } catch (err) {
    console.error('Failed to copy SVG', err)
    return false
  }
}

// Export all cards into a ZIP file with both SVG and PNG
export async function exportAllCardsZip(cards: QRCodeCardItem[], onProgress?: (percent: number) => void): Promise<void> {
  const zip = new JSZip()
  const svgFolder = zip.folder('svg')
  const pngFolder = zip.folder('png_high_res')

  const total = cards.length

  for (let i = 0; i < total; i++) {
    const card = cards[i]
    const safeTitle = `${i + 1}_${(card.title || 'qrcode').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}`

    // Render SVG
    const qrSvg = createQRCodeStylingInstance(card, 1200)
    const svgRaw = await qrSvg.getRawData('svg')
    if (svgRaw && svgFolder) {
      const svgBlob = svgRaw instanceof Blob ? svgRaw : new Blob([svgRaw as unknown as BlobPart], { type: 'image/svg+xml' })
      svgFolder.file(`${safeTitle}.svg`, svgBlob)
    }

    // Render PNG
    const qrPng = createQRCodeStylingInstance(card, 2048)
    const pngRaw = await qrPng.getRawData('png')
    if (pngRaw && pngFolder) {
      const pngBlob = pngRaw instanceof Blob ? pngRaw : new Blob([pngRaw as unknown as BlobPart], { type: 'image/png' })
      pngFolder.file(`${safeTitle}.png`, pngBlob)
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100))
    }
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `qrcodes_pack_${new Date().toISOString().slice(0, 10)}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
