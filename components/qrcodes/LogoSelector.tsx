import React, { useRef } from 'react'
import { Upload, Trash2, ShieldCheck, Image as ImageIcon } from 'lucide-react'
import { PRESET_ICONS } from '../../constants/presets'
import type { QRCodeCardItem } from '../../types/qrcode'

interface LogoSelectorProps {
  card: QRCodeCardItem
  onChange: (updated: Partial<QRCodeCardItem>) => void
}

export const LogoSelector: React.FC<LogoSelectorProps> = ({ card, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleciona um ficheiro de imagem válido (PNG, SVG, JPG, WEBP).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUri = event.target?.result as string
      if (dataUri) {
        onChange({
          logoUrl: dataUri,
          logoPresetId: null
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_ICONS.find((p) => p.id === presetId)
    if (preset) {
      onChange({
        logoUrl: preset.svgDataUri,
        logoPresetId: preset.id
      })
    }
  }

  const handleRemoveLogo = () => {
    onChange({
      logoUrl: null,
      logoPresetId: null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          Logótipo Central
        </label>
        {card.logoUrl && (
          <button
            type="button"
            onClick={handleRemoveLogo}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Remover Logo
          </button>
        )}
      </div>

      {/* Preset Icons Quick Bar */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
        {PRESET_ICONS.map((preset) => {
          const isSelected = card.logoPresetId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              title={preset.name}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/30 border border-indigo-500 shadow-sm shadow-indigo-500/20 scale-105'
                  : 'bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 hover:scale-105'
              }`}
            >
              <img src={preset.svgDataUri} alt={preset.name} className="w-5 h-5 object-contain" />
            </button>
          )
        })}
      </div>

      {/* Custom Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleFileUpload}
          className="hidden"
          id={`upload-${card.id}`}
        />
        <label
          htmlFor={`upload-${card.id}`}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 border border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl cursor-pointer transition-all group"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Fazer upload de logo (PNG, SVG, JPG)</span>
        </label>
      </div>

      {/* Controls when logo is active */}
      {card.logoUrl && (
        <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-3">
          {/* Logo Margin Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                Margem / Padding de Segurança:
              </span>
              <span className="font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50 text-[11px]">
                {card.logoMargin}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={card.logoMargin}
              onChange={(e) => onChange({ logoMargin: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0px (Junto aos módulos)</span>
              <span>10px (Recomendado)</span>
              <span>20px (Espaçoso)</span>
            </div>
          </div>

          {/* Logo Size Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-medium">Escala do Logótipo:</span>
              <span className="font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50 text-[11px]">
                {Math.round(card.logoSize * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.40"
              step="0.01"
              value={card.logoSize}
              onChange={(e) => onChange({ logoSize: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>15% (Discreto)</span>
              <span>30% (Ideal)</span>
              <span>40% (Máximo)</span>
            </div>
          </div>

          {/* Safe Zone Protection indicator */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Zona de Exclusão Ativa:</strong> Os módulos centrais são omitidos automaticamente sem sobreposição cega. Nível H (30% tolerância) ativado.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
