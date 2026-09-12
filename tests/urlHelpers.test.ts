import { describe, it, expect } from 'vitest';
import {
  isValidUrl,
  sanitizeUrl,
  buildWhatsAppUrl,
  buildInstagramUrl,
  buildDiscordUrl,
  buildWifiString,
} from '../utils/urlHelpers';

describe('urlHelpers', () => {
  describe('isValidUrl', () => {
    it('rejeita entradas vazias', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('   ')).toBe(false);
      expect(isValidUrl(undefined as unknown as string)).toBe(false);
    });

    it('aceita URLs standard', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('example.com')).toBe(true);
      expect(isValidUrl('https://sub.dominio.pt/caminho?q=1')).toBe(true);
    });

    it('aceita formatos especiais', () => {
      expect(isValidUrl('WIFI:S:teste;T:WPA;P:pass;;')).toBe(true);
      expect(isValidUrl('mailto:neei@aaualg.pt')).toBe(true);
      expect(isValidUrl('tel:+351912345678')).toBe(true);
    });

    it('rejeita strings que não são URLs', () => {
      expect(isValidUrl('notaurl')).toBe(false);
      expect(isValidUrl('hello world')).toBe(false);
      expect(isValidUrl('localhost')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('preserva URLs já completas', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('mailto:neei@aaualg.pt')).toBe('mailto:neei@aaualg.pt');
      expect(sanitizeUrl('tel:+351912345678')).toBe('tel:+351912345678');
      expect(sanitizeUrl('WIFI:S:x;T:WPA;P:y;;')).toBe('WIFI:S:x;T:WPA;P:y;;');
    });

    it('adiciona https:// a domínios nus', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com');
    });

    it('devolve string vazia para entradas vazias', () => {
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl('   ')).toBe('');
    });
  });

  describe('buildWhatsAppUrl', () => {
    it('limpa o número para apenas dígitos', () => {
      expect(buildWhatsAppUrl('+351 912 345 678')).toBe('https://wa.me/351912345678');
    });

    it('adiciona a mensagem codificada', () => {
      expect(buildWhatsAppUrl('351912345678', 'Olá NEEI!')).toBe(
        'https://wa.me/351912345678?text=Ol%C3%A1%20NEEI!'
      );
    });

    it('devolve vazio para número inválido', () => {
      expect(buildWhatsAppUrl('abc')).toBe('');
      expect(buildWhatsAppUrl('')).toBe('');
    });
  });

  describe('buildInstagramUrl', () => {
    it('remove o @ do handle', () => {
      expect(buildInstagramUrl('@neeiualg')).toBe('https://instagram.com/neeiualg');
      expect(buildInstagramUrl('neeiualg')).toBe('https://instagram.com/neeiualg');
    });

    it('devolve vazio para handle vazio', () => {
      expect(buildInstagramUrl('')).toBe('');
      expect(buildInstagramUrl('   ')).toBe('');
    });
  });

  describe('buildDiscordUrl', () => {
    it('normaliza convites de várias formas', () => {
      expect(buildDiscordUrl('https://discord.gg/HzBuRFCAb5')).toBe(
        'https://discord.gg/HzBuRFCAb5'
      );
      expect(buildDiscordUrl('discord.gg/HzBuRFCAb5')).toBe('https://discord.gg/HzBuRFCAb5');
      expect(buildDiscordUrl('discord.com/invite/HzBuRFCAb5')).toBe(
        'https://discord.gg/HzBuRFCAb5'
      );
      expect(buildDiscordUrl('HzBuRFCAb5')).toBe('https://discord.gg/HzBuRFCAb5');
    });

    it('devolve vazio para convite vazio', () => {
      expect(buildDiscordUrl('')).toBe('');
    });
  });

  describe('buildWifiString', () => {
    it('gera o formato QR-code WIFI', () => {
      expect(buildWifiString('NEEI', 'pass123', 'WPA')).toBe('WIFI:S:NEEI;T:WPA;P:pass123;;');
      expect(buildWifiString('UAlg', 'abc', 'WEP')).toBe('WIFI:S:UAlg;T:WEP;P:abc;;');
      expect(buildWifiString('Edifício 7', '')).toBe('WIFI:S:Edifício 7;T:WPA;P:;;');
    });
  });
});
