import React, { useState } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import type { QRCodeCardItem } from '../../types/qrcode'
import { QRPreview } from './QRPreview'

interface PrintSheetProps {
  cards: QRCodeCardItem[]
  onBack: () => void
}

export const PrintSheet: React.FC<PrintSheetProps> = ({ cards, onBack }) => {
  const [columns, setColumns] = useState<2 | 3>(2)
  const [showCutGuides, setShowCutGuides] = useState(true)
  const [showUrlText, setShowUrlText] = useState(true)
  const [headerText, setHeaderText] = useState('Aponte a Câmara para Aceder')

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (hidden during print) */}
      <div className="print:hidden p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Editor</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <span className="text-xs text-slate-400 font-medium">
            Folha de Impressão ({cards.length} cartões)
          </span>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Colunas:</span>
            <button
              type="button"
              onClick={() => setColumns(2)}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                columns === 2 ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2x2
            </button>
            <button
              type="button"
              onClick={() => setColumns(3)}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                columns === 3 ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              3x3
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCutGuides}
              onChange={(e) => setShowCutGuides(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>Linhas de Corte</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUrlText}
              onChange={(e) => setShowUrlText(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>Mostrar URL legível</span>
          </label>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto print:max-w-none print:p-0 print:shadow-none print:rounded-none">
        {/* Print Header */}
        <div className="text-center mb-8 pb-4 border-b border-slate-200">
          <input
            type="text"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-center bg-transparent border-none focus:outline-none w-full"
          />
          <p className="text-xs text-slate-500 mt-1">
            Utilize a câmara do seu smartphone para apontar e aceder instantaneamente aos links oficiais.
          </p>
        </div>

        {/* Print Grid */}
        <div
          className={`grid gap-8 ${
            columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className={`flex flex-col items-center justify-between p-6 rounded-2xl bg-white transition-all text-center ${
                showCutGuides ? 'border-2 border-dashed border-slate-300' : 'border border-slate-100 shadow-sm'
              }`}
            >
              <h3 className="text-base font-bold text-slate-900 mb-3 truncate w-full px-2">
                {card.title || 'QR Code'}
              </h3>

              <div className="p-3 bg-white rounded-xl flex items-center justify-center">
                <QRPreview card={card} size={columns === 2 ? 220 : 170} />
              </div>

              {showUrlText && (
                <div className="mt-3 w-full">
                  <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs mx-auto">
                    {card.url}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Print Footer */}
        <div className="text-center mt-10 pt-4 border-t border-slate-200 text-[10px] text-slate-400">
          NEEI - Núcleo de Estudantes de Engenharia Informática &bull; UAlg &bull; {new Date().toLocaleDateString('pt-PT')}
        </div>
      </div>
    </div>
  )
}
