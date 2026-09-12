import React from 'react'
import {
  QrCode,
  Plus,
  Printer,
  Archive,
  RotateCcw,
  LayoutGrid,
  MonitorPlay
} from 'lucide-react'

export type ViewMode = 'editor' | 'presentation' | 'print'

interface NavbarProps {
  cardCount: number
  currentView: ViewMode
  onChangeView: (view: ViewMode) => void
  onAddCard: () => void
  onExportAllZip: () => void
  onResetDefaults: () => void
  isZipping: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  cardCount,
  currentView,
  onChangeView,
  onAddCard,
  onExportAllZip,
  onResetDefaults,
  isZipping
}) => {
  return (
    <header className="sticky top-16 z-30 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 py-3.5 print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <QrCode className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white m-0 p-0 leading-tight">
                  Links &bull; NEEI QR Studio
                </h1>
                <span className="text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded-full">
                  {cardCount} {cardCount === 1 ? 'QR Code' : 'QR Codes'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 m-0 p-0">
                Gerador, impressor e ecrã de apresentação com identidade NEEI
              </p>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              {cardCount} {cardCount === 1 ? 'cartão' : 'cartões'}
            </span>
          </div>
        </div>

        {/* Global Action & View Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end">
          {/* Main View Switchers */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onChangeView('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'editor'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeView('presentation')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currentView === 'presentation'
                  ? 'bg-gradient-to-r from-[#00668c] to-cyan-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Apresentar (NEEI)</span>
              <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono uppercase">
                Novo
              </span>
            </button>

            <button
              type="button"
              onClick={() => onChangeView('print')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'print'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onResetDefaults}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
            title="Restaurar os 3 cartões pré-configurados padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Padrão</span>
          </button>

          <button
            type="button"
            onClick={onExportAllZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            title="Descarregar todos os QR Codes em SVG e PNG comprimidos em ZIP"
          >
            <Archive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isZipping ? 'A Gerar...' : 'ZIP'}</span>
          </button>

          <button
            type="button"
            onClick={onAddCard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>
    </header>
  )
}
