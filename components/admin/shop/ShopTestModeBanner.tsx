import React from 'react';
import { FlaskConical, Eye, ExternalLink, Check, Copy, Smartphone } from 'lucide-react';

interface ShopTestModeBannerProps {
  showTestShop: boolean;
  previewUrl: string;
  copiedLink: boolean;
  handleCopyLink: () => void;
  showQrCode: boolean;
  setShowQrCode: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export const ShopTestModeBanner: React.FC<ShopTestModeBannerProps> = ({
  showTestShop,
  previewUrl,
  copiedLink,
  handleCopyLink,
  showQrCode,
  setShowQrCode,
}) => {
  if (!showTestShop) return null;

  return (
    <>
      {/* Banner de Modo de Teste da Loja (Checkout Real a 0.50€) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/60 border border-cyan-500/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
              <FlaskConical size={13} />
              Modo de Teste da Loja
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/20">
              Preço Especial: 0.50€
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Permite testar o fluxo de compra e pagamentos reais (MB WAY, Cartões, Apple Pay) com valor reduzido para apenas <strong>0.50€</strong> (mínimo Stripe) sem limitações de sandbox. Ativado via <code>SHOW_TEST_SHOP=true</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Eye size={14} />
            <span>Abrir Loja de Teste (0.50€)</span>
            <ExternalLink size={13} />
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar link com token para colar no telemóvel"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link p/ Tele'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrCode((prev) => !prev)}
            className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Mostrar QR Code para ler com a câmara do telemóvel"
          >
            <Smartphone size={14} className="text-cyan-400" />
            <span>{showQrCode ? 'Ocultar QR' : 'QR Telemóvel'}</span>
          </button>
        </div>
      </div>

      {/* QR Code Desdobrável para Testes Rápidos no Telemóvel */}
      {showQrCode && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 max-w-sm mx-auto text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
            <Smartphone size={16} className="text-cyan-400" />
            Aponta a câmara do telemóvel
          </h4>
          <p className="text-xs text-slate-400">
            Abre a loja no teu telemóvel com sessão admin ativa e preço de 0.50€:
          </p>
          <div className="p-3 bg-white rounded-2xl inline-block shadow-lg mx-auto">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                previewUrl
              )}`}
              alt="QR Code de Teste"
              className="w-44 h-44 mx-auto"
            />
          </div>
          <p className="text-[11px] text-slate-400 font-mono break-all px-2">
            {previewUrl}
          </p>
        </div>
      )}
    </>
  );
};
