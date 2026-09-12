import React from 'react'
import { Sparkles, Check } from 'lucide-react'
import { COLOR_THEMES } from '../../constants/colorThemes'
import type { DotType, QRCodeCardItem, CornerSquareType } from '../../types/qrcode'

interface ColorPickerProps {
  card: QRCodeCardItem
  onChange: (updated: Partial<QRCodeCardItem>) => void
}

const DOT_STYLES: { id: DotType; label: string }[] = [
  { id: 'rounded', label: 'Arredondado' },
  { id: 'dots', label: 'Pontos Circulares' },
  { id: 'classy', label: 'Elegante (Classy)' },
  { id: 'classy-rounded', label: 'Classy Suave' },
  { id: 'square', label: 'Quadrado Tradicional' },
  { id: 'extra-rounded', label: 'Super Suave' }
]

const CORNER_STYLES: { id: CornerSquareType; label: string }[] = [
  { id: 'extra-rounded', label: 'Curvo' },
  { id: 'dot', label: 'Circular' },
  { id: 'square', label: 'Quadrado' }
]

export const ColorPicker: React.FC<ColorPickerProps> = ({ card, onChange }) => {
  const handleApplyTheme = (themeId: string) => {
    const theme = COLOR_THEMES.find((t) => t.id === themeId)
    if (theme) {
      onChange({
        dotColor: theme.dotColor,
        bgColor: theme.bgColor,
        isTransparentBg: false,
        cornerSquareColor: theme.cornerSquareColor,
        cornerDotColor: theme.cornerDotColor,
        themeName: theme.id
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Themes Palette Quick Bar */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Paletas de Estilo Prontas
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {COLOR_THEMES.map((theme) => {
            const isCurrent = card.dotColor === theme.dotColor && card.bgColor === theme.bgColor
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleApplyTheme(theme.id)}
                title={theme.name}
                className={`group relative flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-md shadow-inner flex items-center justify-center border border-black/20"
                  style={{ backgroundColor: theme.bgColor }}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.dotColor }} />
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-1 w-full text-center">
                  {theme.name.split(' ')[0]}
                </span>
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5 shadow">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Manual Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
        {/* Module Color */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center justify-between">
            <span>Cor dos Módulos / Pixeis</span>
            <span className="font-mono text-slate-400 text-[11px] uppercase">{card.dotColor}</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 shadow-inner shrink-0">
              <input
                type="color"
                value={card.dotColor}
                onChange={(e) =>
                  onChange({
                    dotColor: e.target.value,
                    cornerSquareColor: e.target.value,
                    cornerDotColor: e.target.value
                  })
                }
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-100"
              />
            </div>
            <input
              type="text"
              value={card.dotColor}
              onChange={(e) =>
                onChange({
                  dotColor: e.target.value,
                  cornerSquareColor: e.target.value,
                  cornerDotColor: e.target.value
                })
              }
              className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Background Color */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">Cor de Fundo</label>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={card.isTransparentBg}
                onChange={(e) => onChange({ isTransparentBg: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Transparente</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 shadow-inner shrink-0 ${
                card.isTransparentBg ? 'bg-[linear-gradient(45deg,#202020_25%,transparent_25%),linear-gradient(-45deg,#202020_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#202020_75%),linear-gradient(-45deg,transparent_75%,#202020_75%)] bg-[size:8px_8px]' : ''
              }`}
            >
              {!card.isTransparentBg && (
                <input
                  type="color"
                  value={card.bgColor}
                  onChange={(e) => onChange({ bgColor: e.target.value })}
                  className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-100"
                />
              )}
            </div>
            <input
              type="text"
              disabled={card.isTransparentBg}
              value={card.isTransparentBg ? 'Transparente' : card.bgColor}
              onChange={(e) => onChange({ bgColor: e.target.value })}
              className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Shapes / Geometries */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-2">
            <span>Formato dos Módulos (Pixeis)</span>
            <span className="text-[11px] font-normal text-indigo-400 capitalize">
              {DOT_STYLES.find((s) => s.id === card.dotType)?.label || card.dotType}
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {DOT_STYLES.map((style) => {
              const isSelected = card.dotType === style.id
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onChange({ dotType: style.id })}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/70 text-slate-300'
                  }`}
                >
                  <span className="truncate">{style.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-2">
            <span>Formato dos Cantos (Marcadores)</span>
            <span className="text-[11px] font-normal text-indigo-400 capitalize">
              {CORNER_STYLES.find((s) => s.id === card.cornerSquareType)?.label || card.cornerSquareType}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {CORNER_STYLES.map((style) => {
              const isSelected = card.cornerSquareType === style.id
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onChange({ cornerSquareType: style.id })}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/70 text-slate-300'
                  }`}
                >
                  <span className="truncate">{style.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
