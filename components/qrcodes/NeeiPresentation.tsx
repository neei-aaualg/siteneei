import React, { useState, useEffect, useRef } from 'react'
import {
  ExternalLink,
  Copy,
  Check,
  Maximize,
  Minimize,
  CameraOff,
  MapPin,
  Globe
} from 'lucide-react'
import type { QRCodeCardItem } from '../../types/qrcode'
import { QRPreview } from './QRPreview'

const InstagramIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const WhatsAppIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.217 8.217 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24z" />
  </svg>
)

const DiscordIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

interface NeeiPresentationProps {
  cards: QRCodeCardItem[]
  onNotify: (msg: string) => void
}

export const NeeiPresentation: React.FC<NeeiPresentationProps> = ({
  cards,
  onNotify
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  // Manage selected cards (defaults to first 3)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => cards.slice(0, 3).map((c) => c.id))

  const toggleCardSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id))
      } else {
        onNotify('Deves manter pelo menos 1 cartão selecionado.')
      }
    } else {
      if (selectedIds.length >= 3) {
        setSelectedIds([...selectedIds.slice(1), id])
      } else {
        setSelectedIds([...selectedIds, id])
      }
    }
  }

  // Cards to display (always up to 3)
  const displayCards = cards.filter((c) => selectedIds.includes(c.id)).slice(0, 3)

  // Fullscreen only on the presentation slide container (ignoring the header completely)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (slideRef.current?.requestFullscreen) {
        slideRef.current.requestFullscreen().catch(() => {
          onNotify('Modo ecrã inteiro não suportado neste navegador.')
        })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const [screenHeight, setScreenHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900
  )

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      setScreenHeight(window.innerHeight)
    }
    const handleResize = () => {
      setScreenHeight(window.innerHeight)
    }

    document.addEventListener('fullscreenchange', handleFsChange)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(text)
    onNotify(`${label} copiado!`)
    setTimeout(() => {
      setCopiedLink((current) => (current === text ? null : current))
    }, 2500)
  }

  // Dynamic QR size and compact layout mode to ensure comfortable top margin and fit on laptop screens
  const isCompactLaptop = isFullscreen && screenHeight < 860
  const qrSize = isFullscreen
    ? screenHeight < 760
      ? 180
      : screenHeight < 880
      ? 205
      : 250
    : 210

  // Pure presentation styling with dark mode support
  const pageBg = 'bg-[#f0f7fa] dark:bg-[#070d14] text-[#1d1c1c] dark:text-slate-100 transition-colors duration-300'
  const cardBg = 'bg-white dark:bg-[#0c1421] border border-[#b6ccd8]/70 dark:border-slate-800 shadow-lg shadow-cyan-900/5 dark:shadow-black/40 text-[#1d1c1c] dark:text-slate-100'

  return (
    <div className={`min-h-screen flex flex-col font-sans ${pageBg}`}>
      {/* Top Controls Bar (Hidden during Fullscreen) */}
      {!isFullscreen && (
        <div className="backdrop-blur-xl border-b px-4 sm:px-8 py-3 bg-white/95 dark:bg-[#0c1421]/90 border-[#d4eaf7] dark:border-slate-800 transition-colors">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Status & Branding */}
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                Canais Oficiais &bull; Apresentação
              </span>
            </div>

            {/* Right Controls: Fullscreen */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-[#00668c] hover:bg-[#005574] dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white shadow-md active:scale-95"
                title="Apresentar em Ecrã Inteiro (como um slide de evento)"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>Ecrã Inteiro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Canvas / Slide */}
      <div
        ref={slideRef}
        className={`flex-1 flex flex-col items-center ${pageBg} ${isFullscreen
          ? 'pt-16 pb-12 px-4 sm:pt-20 sm:pb-16 sm:px-8 min-h-screen w-screen overflow-y-auto'
          : 'py-8 sm:py-12 px-4 sm:px-8 max-w-6xl mx-auto w-full'
          }`}
      >
        {/* Floating exit button when in fullscreen */}
        {isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/85 hover:bg-slate-900 text-white border border-slate-700 shadow-xl backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100"
            title="Sair do modo ecrã inteiro (ou pressiona ESC)"
          >
            <Minimize className="w-3.5 h-3.5" />
            <span>Sair (Esc)</span>
          </button>
        )}

        <div className={`w-full ${isCompactLaptop ? 'space-y-5' : 'space-y-7 sm:space-y-8'} max-w-5xl my-auto`}>
          {/* Header of the Page: Clean NEEI Branding & Title */}
          <div className={`text-center ${isCompactLaptop ? 'space-y-2' : 'space-y-3'}`}>
            <div className="flex items-center justify-center gap-3">
              <img
                src="/assets/logoneeipequeno-removebg-preview.png"
                alt="NEEI"
                className={`${isCompactLaptop ? 'h-9 sm:h-10' : 'h-10 sm:h-12'} w-auto object-contain`}
                onError={(e) => {
                  // Fallback if needed
                  (e.target as HTMLImageElement).src = '/assets/logoneeigrande-removebg-preview.png'
                }}
              />
              <div className="text-left leading-tight">
                <span className="text-[13px] font-medium block text-[#00668c] dark:text-cyan-400">
                  Núcleo de Estudantes de Engenharia Informática &bull; UAlg
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm transition-colors bg-[#d4eaf7] dark:bg-cyan-950/60 border-[#b6ccd8] dark:border-cyan-800/50 text-[#00668c] dark:text-cyan-300">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Sala 0.18 &bull; Campus de Gambelas, Faro</span>
            </div>

            <h1 className={`${isCompactLaptop ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-black tracking-tight leading-tight m-0 text-slate-900 dark:text-white`}>
              Junta-te aos Nossos Canais
            </h1>
            <p className="text-xs sm:text-sm max-w-lg mx-auto text-slate-600 dark:text-slate-400">
              Aponta a câmara do teu telemóvel para qualquer um dos QR Codes abaixo para acederes aos grupos e redes oficiais.
            </p>
          </div>

          {/* 3 QR CODES SIDE BY SIDE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full items-stretch">
            {displayCards.map((card, index) => {
              let CategoryIcon: React.ComponentType<{ className?: string }> = Globe
              let badgeColor = 'bg-slate-800 text-white'

              if (card.category === 'whatsapp' || card.title.toLowerCase().includes('whatsapp')) {
                CategoryIcon = WhatsAppIcon
                badgeColor = 'bg-emerald-600 text-white'
              } else if (card.category === 'instagram' || card.title.toLowerCase().includes('instagram')) {
                CategoryIcon = InstagramIcon
                badgeColor = 'bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white'
              } else if (card.category === 'discord' || card.title.toLowerCase().includes('discord')) {
                CategoryIcon = DiscordIcon
                badgeColor = 'bg-[#5865F2] text-white'
              }

              return (
                <div
                  key={card.id || index}
                  className={`flex flex-col items-center justify-between ${isCompactLaptop ? 'p-4 sm:p-5' : 'p-6 sm:p-7'} rounded-3xl transition-all duration-300 ${cardBg}`}
                >
                  {/* Category Pill */}
                  <div className={`w-full flex items-center justify-start ${isCompactLaptop ? 'mb-2' : 'mb-3'}`}>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${badgeColor}`}>
                      <CategoryIcon className="w-3.5 h-3.5" />
                      <span>{card.title.split(' ')[0] || 'Canal'}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <div className={`text-center w-full ${isCompactLaptop ? 'mb-2' : 'mb-3'}`}>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight truncate w-full m-0 text-slate-900 dark:text-white">
                      {card.title}
                    </h3>
                  </div>

                  {/* QR Code Container in Crisp White */}
                  <div className={`${isCompactLaptop ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4'} bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700/60 flex items-center justify-center ${isCompactLaptop ? 'my-0.5' : 'my-1'}`}>
                    <QRPreview card={card} size={qrSize} />
                  </div>

                  {/* URL / Action */}
                  <div className={`w-full ${isCompactLaptop ? 'mt-3 space-y-1.5' : 'mt-4 space-y-2'}`}>
                    <div className="p-2 rounded-xl text-center font-mono text-[11px] truncate border bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-[#00668c] dark:text-cyan-400">
                      {card.url}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-[#00668c] hover:bg-[#005574] dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white shadow-sm"
                      >
                        <span>Aceder</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(card.url, card.title)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${copiedLink === card.url
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        title="Copiar link"
                      >
                        {copiedLink === card.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* FALLBACK LINK FOR PEOPLE WHOSE CAMERA IS NOT WORKING */}
          <div className={`relative overflow-hidden rounded-3xl ${isCompactLaptop ? 'p-3.5 sm:p-4' : 'p-5 sm:p-6'} border transition-all duration-300 shadow-md bg-gradient-to-r from-white via-[#f0f7fa] to-[#d4eaf7]/80 dark:from-[#0c1421] dark:via-[#0c1421] dark:to-cyan-950/40 border-[#b6ccd8] dark:border-slate-800`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CameraOff className="w-4 h-4 text-[#00668c] dark:text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00668c] dark:text-cyan-400">
                    Sem câmara ou não consegues ler o QR Code?
                  </span>
                </div>
                <p className="text-xs sm:text-sm m-0 text-slate-700 dark:text-slate-300">
                  Abre o teu navegador e acede a todos os canais e links diretamente em:
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-mono text-sm sm:text-base font-bold border shadow-sm bg-[#d4eaf7] dark:bg-cyan-950/70 text-[#00668c] dark:text-cyan-300 border-[#b6ccd8] dark:border-cyan-800/60">
                  <Globe className="w-4 h-4" />
                  <span>neei.online/links</span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal slide footer */}
          <div className="text-center pt-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span>Núcleo de Estudantes de Engenharia Informática &bull; Universidade do Algarve</span>
          </div>
        </div>
      </div>
    </div>
  )
}
