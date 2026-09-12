import React, { useState, useEffect } from 'react'
import {
  Plus,
  ShieldCheck,
  FileCode2,
  Layers
} from 'lucide-react'
import type { QRCodeCardItem } from '../types/qrcode'
import { DEFAULT_INITIAL_CARDS, SVG_ICONS, svgToDataUri } from '../constants/presets'
import { QRCodeCard } from '../components/qrcodes/QRCodeCard'
import { PrintSheet } from '../components/qrcodes/PrintSheet'
import { Navbar, type ViewMode } from '../components/qrcodes/Navbar'
import { NeeiPresentation } from '../components/qrcodes/NeeiPresentation'
import { Toast } from '../components/qrcodes/Toast'
import { exportAllCardsZip } from '../utils/exportQr'
import confetti from 'canvas-confetti'

const Links: React.FC = () => {
  useEffect(() => {
    document.title = 'Links e QR Codes | NEEI'
  }, [])

  const [cards, setCards] = useState<QRCodeCardItem[]>(() => {
    try {
      const saved = localStorage.getItem('qr_studio_cards_v1')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return DEFAULT_INITIAL_CARDS
  })

  const [currentView, setCurrentView] = useState<ViewMode>('editor')
  const [isZipping, setIsZipping] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'whatsapp' | 'instagram' | 'discord' | 'custom'>('all')

  const notify = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current))
    }, 3000)
  }

  // Persist cards whenever updated
  const saveCards = (newCards: QRCodeCardItem[]) => {
    setCards(newCards)
    try {
      localStorage.setItem('qr_studio_cards_v1', JSON.stringify(newCards))
    } catch {
      // storage quota or private mode
    }
  }

  const handleUpdateCard = (id: string, updated: Partial<QRCodeCardItem>) => {
    saveCards(
      cards.map((c) => (c.id === id ? { ...c, ...updated } : c))
    )
  }

  const handleDuplicateCard = (id: string) => {
    const target = cards.find((c) => c.id === id)
    if (!target) return

    const newCard: QRCodeCardItem = {
      ...target,
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${target.title} (Cópia)`
    }
    saveCards([...cards, newCard])
    notify('Cartão duplicado!')
  }

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) {
      notify('Precisas de manter pelo menos 1 cartão.')
      return
    }
    saveCards(cards.filter((c) => c.id !== id))
    notify('Cartão removido.')
  }

  const handleAddCard = (category: QRCodeCardItem['category'] = 'custom') => {
    let defaultUrl = 'https://'
    let defaultLogo: string | null = null
    let defaultPresetId: string | null = null
    let defaultTitle = 'Novo QR Code'
    let defaultDotColor = '#1e293b'

    if (category === 'whatsapp') {
      defaultTitle = 'WhatsApp Suporte'
      defaultUrl = 'https://wa.me/351900000000'
      defaultLogo = svgToDataUri(SVG_ICONS.whatsapp)
      defaultPresetId = 'whatsapp'
      defaultDotColor = '#075E54'
    } else if (category === 'instagram') {
      defaultTitle = 'Instagram Perfil'
      defaultUrl = 'https://instagram.com/perfil'
      defaultLogo = svgToDataUri(SVG_ICONS.instagram)
      defaultPresetId = 'instagram'
      defaultDotColor = '#833AB4'
    } else if (category === 'discord') {
      defaultTitle = 'Discord Servidor'
      defaultUrl = 'https://discord.gg/link'
      defaultLogo = svgToDataUri(SVG_ICONS.discord)
      defaultPresetId = 'discord'
      defaultDotColor = '#5865F2'
    }

    const newCard: QRCodeCardItem = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: defaultTitle,
      category,
      url: defaultUrl,
      logoUrl: defaultLogo,
      logoPresetId: defaultPresetId,
      logoMargin: 6,
      logoSize: 0.32,
      dotColor: defaultDotColor,
      bgColor: '#FFFFFF',
      isTransparentBg: false,
      dotType: 'rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      cornerSquareColor: defaultDotColor,
      cornerDotColor: defaultDotColor,
      errorCorrectionLevel: 'H'
    }

    saveCards([...cards, newCard])
    notify('Novo cartão adicionado!')
  }

  const handleResetDefaults = () => {
    if (window.confirm('Desejas restaurar os 3 cartões padrão (WhatsApp, Instagram, Discord)?')) {
      saveCards(DEFAULT_INITIAL_CARDS)
      notify('Cartões padrão restaurados!')
    }
  }

  const handleExportAllZip = async () => {
    if (cards.length === 0) return
    setIsZipping(true)
    try {
      await exportAllCardsZip(cards)
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } })
      notify(`Pacote ZIP exportado com ${cards.length} QR Codes (SVG + PNG)!`)
    } catch (err) {
      console.error(err)
      notify('Erro ao gerar ficheiro ZIP.')
    } finally {
      setIsZipping(false)
    }
  }

  const filteredCards = cards.filter((card) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'whatsapp') return card.category === 'whatsapp'
    if (activeFilter === 'instagram') return card.category === 'instagram'
    if (activeFilter === 'discord') return card.category === 'discord'
    return card.category === 'custom' || card.category === 'url' || card.category === 'wifi'
  })

  // Full presentation view (fullscreen or custom presentation)
  if (currentView === 'presentation') {
    return (
      <div className="min-h-screen flex flex-col">
        <NeeiPresentation
          cards={cards}
          onBack={() => setCurrentView('editor')}
          onNotify={notify}
        />
        <Toast message={toastMessage} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-16">
      <Navbar
        cardCount={cards.length}
        currentView={currentView}
        onChangeView={setCurrentView}
        onAddCard={() => handleAddCard('custom')}
        onExportAllZip={handleExportAllZip}
        onResetDefaults={handleResetDefaults}
        isZipping={isZipping}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {currentView === 'print' ? (
          <PrintSheet cards={cards} onBack={() => setCurrentView('editor')} />
        ) : (
          <div className="space-y-6">
            {/* Highlights Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-cyan-950/50 border border-slate-800 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Proteção Anti-Distorção Ativa
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 flex items-center gap-1">
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                      SVG Vetorial Puro + PNG 2048px
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentView('presentation')}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00668c]/30 hover:bg-[#00668c]/50 border border-cyan-500/50 text-cyan-300 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Ecrã NEEI (3 QR Codes) &rarr;
                    </button>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
                    Crie e Partilhe QR Codes Prontos para Impressão e Apresentação
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                    Cada código possui <strong>Nível H (30% de tolerância)</strong> e margem de segurança configurável ao redor do logótipo central, garantindo que os módulos não tapam o logo e proporcionando leitura instantânea em qualquer smartphone.
                  </p>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAddCard('whatsapp')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    + WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCard('instagram')}
                    className="px-3 py-1.5 text-xs font-semibold text-pink-300 bg-pink-950/50 hover:bg-pink-900/60 border border-pink-800/60 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    + Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCard('discord')}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    + Discord
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Counter */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({cards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('whatsapp')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'whatsapp'
                      ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WhatsApp ({cards.filter((c) => c.category === 'whatsapp').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('instagram')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'instagram'
                      ? 'bg-pink-950 text-pink-300 font-semibold border border-pink-800/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Instagram ({cards.filter((c) => c.category === 'instagram').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('discord')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'discord'
                      ? 'bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Discord ({cards.filter((c) => c.category === 'discord').length})
                </button>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{filteredCards.length} {filteredCards.length === 1 ? 'código listado' : 'códigos listados'}</span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCards.map((card) => (
                <QRCodeCard
                  key={card.id}
                  card={card}
                  onUpdate={(updated) => handleUpdateCard(card.id, updated)}
                  onDuplicate={() => handleDuplicateCard(card.id)}
                  onDelete={() => handleDeleteCard(card.id)}
                  canDelete={cards.length > 1}
                  onNotify={notify}
                />
              ))}

              {/* Add New Card Slot */}
              <button
                type="button"
                onClick={() => handleAddCard('custom')}
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-900/30 hover:bg-slate-900/60 rounded-2xl transition-all group cursor-pointer min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-indigo-600/20 border border-slate-700 group-hover:border-indigo-500/50 flex items-center justify-center transition-all group-hover:scale-110 mb-3 shadow-lg">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white mb-1">
                  Adicionar Novo Cartão
                </span>
                <span className="text-xs text-slate-500">
                  Personaliza destino, logótipo, cores e exporta em SVG/PNG
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      <Toast message={toastMessage} />
    </div>
  )
}

export default Links
