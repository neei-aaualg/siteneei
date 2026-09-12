import React, { useState } from 'react'
import {
  Copy,
  Download,
  ExternalLink,
  Trash2,
  CopyPlus,
  Check,
  Globe,
  Sliders,
  Image as ImageIcon,
  MessageCircle,
  Camera,
  Radio
} from 'lucide-react'
import type { QRCodeCardItem } from '../../types/qrcode'
import { QRPreview } from './QRPreview'
import { LogoSelector } from './LogoSelector'
import { ColorPicker } from './ColorPicker'
import { downloadCardSvg, downloadCardPng, copyCardSvgToClipboard } from '../../utils/exportQr'
import {
  isValidUrl,
  sanitizeUrl,
  buildWhatsAppUrl,
  buildInstagramUrl,
  buildDiscordUrl
} from '../../utils/urlHelpers'
import confetti from 'canvas-confetti'

interface QRCodeCardProps {
  card: QRCodeCardItem
  onUpdate: (updated: Partial<QRCodeCardItem>) => void
  onDuplicate: () => void
  onDelete: () => void
  canDelete: boolean
  onNotify: (msg: string) => void
}

type TabType = 'url' | 'logo' | 'style'

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  card,
  onUpdate,
  onDuplicate,
  onDelete,
  canDelete,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('url')
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const isUrlValid = isValidUrl(card.url)

  const handleCopySvg = async () => {
    const success = await copyCardSvgToClipboard(card)
    if (success) {
      setCopied(true)
      onNotify('SVG copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadSvg = async () => {
    setIsExporting(true)
    try {
      await downloadCardSvg(card)
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } })
      onNotify('Ficheiro SVG vetorial exportado com sucesso!')
    } catch (err) {
      console.error(err)
      onNotify('Erro ao exportar SVG.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadPng = async () => {
    setIsExporting(true)
    try {
      await downloadCardPng(card)
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } })
      onNotify('Ficheiro PNG de alta resolução exportado!')
    } catch (err) {
      console.error(err)
      onNotify('Erro ao exportar PNG.')
    } finally {
      setIsExporting(false)
    }
  }

  // Helpers for category specific fields
  const handleWhatsAppPhoneChange = (phone: string) => {
    const newUrl = buildWhatsAppUrl(phone, card.whatsappMessage)
    onUpdate({ whatsappPhone: phone, url: newUrl })
  }

  const handleWhatsAppMessageChange = (msg: string) => {
    const newUrl = buildWhatsAppUrl(card.whatsappPhone || '', msg)
    onUpdate({ whatsappMessage: msg, url: newUrl })
  }

  const handleInstagramHandleChange = (handle: string) => {
    const newUrl = buildInstagramUrl(handle)
    onUpdate({ instagramHandle: handle, url: newUrl })
  }

  const handleDiscordInviteChange = (invite: string) => {
    const newUrl = buildDiscordUrl(invite)
    onUpdate({ discordInvite: invite, url: newUrl })
  }

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 hover:border-slate-750 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden transition-all duration-300 group">
      {/* Top Header */}
      <div className="px-5 py-4 bg-slate-850/70 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            type="text"
            value={card.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Nome / Etiqueta do Cartão"
            className="text-base font-semibold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 w-full truncate transition-all"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicar Cartão"
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <CopyPlus className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Remover Cartão"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Preview on top/left, configuration tabs */}
      <div className="p-5 flex flex-col xl:flex-row gap-6 items-center xl:items-start">
        {/* QR Preview Column */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative p-3.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl group/preview transition-all hover:scale-[1.01]">
            <QRPreview
              key={`${card.id}-${card.dotType}-${card.cornerSquareType}`}
              card={card}
              size={220}
              className="rounded-xl shadow-md"
            />

            {/* Error correction badge */}
            <div className="absolute top-2 right-2 bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full backdrop-blur-md shadow">
              Level H (30%)
            </div>
          </div>

          {/* Direct action buttons below QR preview */}
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SVG Vetor</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Descarregar imagem PNG em alta resolução (2048px)"
            >
              PNG
            </button>
            <button
              type="button"
              onClick={handleCopySvg}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Copiar código SVG para a área de transferência"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Configuration Tabs & Controls Column */}
        <div className="flex-1 w-full min-w-0">
          {/* Tabs Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Destino</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logo')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'logo'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Logótipo</span>
              {card.logoUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'style'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Cores & Estilo</span>
            </button>
          </div>

          {/* Tab 1: URL & Destination */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              {/* Category-Specific Helpers */}
              {card.category === 'whatsapp' && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Auxiliar do WhatsApp</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Número de Telefone (com código de país):
                      </label>
                      <input
                        type="tel"
                        value={card.whatsappPhone || ''}
                        onChange={(e) => handleWhatsAppPhoneChange(e.target.value)}
                        placeholder="Ex: 351912345678"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Mensagem Pré-definida (opcional):
                      </label>
                      <input
                        type="text"
                        value={card.whatsappMessage || ''}
                        onChange={(e) => handleWhatsAppMessageChange(e.target.value)}
                        placeholder="Ex: Olá! Gostaria de falar convosco."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {card.category === 'instagram' && (
                <div className="p-3 bg-pink-950/30 border border-pink-900/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-pink-400">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Auxiliar do Instagram</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Nome de Utilizador / Handle:
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-1.5 text-xs bg-slate-800 border border-r-0 border-slate-700 rounded-l-lg text-slate-400">
                        @
                      </span>
                      <input
                        type="text"
                        value={card.instagramHandle || ''}
                        onChange={(e) => handleInstagramHandleChange(e.target.value)}
                        placeholder="omeuperfil"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-r-lg text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {card.category === 'discord' && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Auxiliar do Discord</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Código ou Link do Servidor:
                    </label>
                    <input
                      type="text"
                      value={card.discordInvite || ''}
                      onChange={(e) => handleDiscordInviteChange(e.target.value)}
                      placeholder="Ex: comunidade ou discord.gg/..."
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Real-time URL Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    URL de Destino
                  </label>
                  <span
                    className={`text-[11px] flex items-center gap-1 ${
                      isUrlValid ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isUrlValid ? (
                      <>
                        <Check className="w-3 h-3" /> Válido
                      </>
                    ) : (
                      'Insere um URL válido'
                    )}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={card.url}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    onBlur={() => {
                      if (card.url && !card.url.startsWith('http') && !card.url.startsWith('WIFI:')) {
                        onUpdate({ url: sanitizeUrl(card.url) })
                      }
                    }}
                    placeholder="https://exemplo.com/pagina"
                    className="w-full px-3 py-2 pr-20 text-xs font-mono bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-slate-100 focus:outline-none"
                  />
                  {card.url && (
                    <a
                      href={sanitizeUrl(card.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Abrir destino numa nova aba para testar"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Testar</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Logo Configuration */}
          {activeTab === 'logo' && (
            <LogoSelector card={card} onChange={onUpdate} />
          )}

          {/* Tab 3: Colors and Shapes */}
          {activeTab === 'style' && (
            <ColorPicker card={card} onChange={onUpdate} />
          )}
        </div>
      </div>
    </div>
  )
}
