import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { QRCodeCardItem } from '../types/qrcode';
import { NeeiPresentation } from '../components/qrcodes/NeeiPresentation';

const makeCard = (
  id: string,
  title: string,
  category: QRCodeCardItem['category'],
  url: string
): QRCodeCardItem => ({
  id,
  title,
  category,
  url,
  qrSvgUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
  logoUrl: null,
  logoPresetId: null,
  logoMargin: 0,
  logoSize: 0.25,
  dotColor: '#000000',
  bgColor: '#ffffff',
  isTransparentBg: false,
  dotType: 'rounded',
  cornerSquareType: 'extra-rounded',
  cornerDotType: 'dot',
  cornerSquareColor: '#000000',
  cornerDotColor: '#000000',
  errorCorrectionLevel: 'H',
});

describe('NeeiPresentation', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mostra os primeiros 3 cartões e o atalho sem câmara', () => {
    const cards = [
      makeCard('c1', 'WhatsApp Oficial', 'whatsapp', 'https://chat.whatsapp.com/abc'),
      makeCard('c2', 'Instagram', 'instagram', 'https://instagram.com/neeiualg'),
      makeCard('c3', 'Discord', 'discord', 'https://discord.gg/neei'),
      makeCard('c4', 'Linktree', 'url', 'https://linktr.ee/neei'),
    ];

    render(<NeeiPresentation cards={cards} onNotify={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'WhatsApp Oficial' })).toBeInTheDocument();
    expect(screen.getAllByText('Instagram')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Discord' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Linktree' })).not.toBeInTheDocument();

    const aceder = screen.getAllByRole('link', { name: /Aceder/ });
    expect(aceder).toHaveLength(3);
    expect(aceder[1]).toHaveAttribute('href', 'https://instagram.com/neeiualg');
    expect(aceder[1]).toHaveAttribute('target', '_blank');
    expect(aceder[1]).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByText('Sem câmara ou não consegues ler o QR Code?')).toBeInTheDocument();
    expect(screen.getByText('neei.online/links')).toBeInTheDocument();
  });

  it('mostra o badge da categoria e o chip dos canais oficiais', () => {
    const cards = [makeCard('c1', 'WhatsApp Oficial', 'whatsapp', 'https://x.example')];

    render(<NeeiPresentation cards={cards} onNotify={vi.fn()} />);

    expect(screen.getByText('Canais Oficiais \u2022 Apresentação')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'WhatsApp Oficial' })).toBeInTheDocument();
    expect(screen.getByText('Ecrã Inteiro')).toBeInTheDocument();
  });

  it('copia o link do cartão e notifica o utilizador', () => {
    const onNotify = vi.fn();
    const cards = [makeCard('c1', 'WhatsApp', 'whatsapp', 'https://chat.whatsapp.com/abc')];

    render(<NeeiPresentation cards={cards} onNotify={onNotify} />);

    fireEvent.click(screen.getByTitle('Copiar link'));
    expect(writeText).toHaveBeenCalledWith('https://chat.whatsapp.com/abc');
    expect(onNotify).toHaveBeenCalledWith('WhatsApp copiado!');
  });
});
