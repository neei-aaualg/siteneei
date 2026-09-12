import React, { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import type { QRCodeCardItem } from '../../types/qrcode'

interface QRPreviewProps {
  card: QRCodeCardItem
  size?: number
  className?: string
}

export const QRPreview: React.FC<QRPreviewProps> = ({ card, size = 260, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: card.url || 'https://google.com',
      image: card.logoUrl || undefined,
      margin: 12,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H'
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: card.logoSize,
        margin: card.logoMargin,
        crossOrigin: 'anonymous',
        saveAsBlob: true
      },
      dotsOptions: {
        color: card.dotColor || '#000000',
        type: card.dotType || 'rounded'
      },
      backgroundOptions: {
        color: card.isTransparentBg ? 'transparent' : (card.bgColor || '#ffffff')
      },
      cornersSquareOptions: {
        color: card.cornerSquareColor || card.dotColor || '#000000',
        type: card.cornerSquareType || 'extra-rounded'
      },
      cornersDotOptions: {
        color: card.cornerDotColor || card.dotColor || '#000000',
        type: card.cornerDotType || 'dot'
      }
    })

    const container = containerRef.current
    container.innerHTML = ''
    qrCode.append(container)

    return () => {
      container.innerHTML = ''
    }
  }, [
    card.url,
    card.logoUrl,
    card.logoMargin,
    card.logoSize,
    card.dotColor,
    card.bgColor,
    card.isTransparentBg,
    card.dotType,
    card.cornerSquareType,
    card.cornerDotType,
    card.cornerSquareColor,
    card.cornerDotColor,
    size
  ])

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: card.isTransparentBg ? 'transparent' : card.bgColor
      }}
    >
      <div ref={containerRef} className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block" />
    </div>
  )
}
