import { describe, it, expect } from 'vitest';
import {
  PORTUGAL_DISTRICTS,
  getPortugalDistricts,
  getCountiesForDistrict,
} from '../constants/portugalDistricts';

describe('constants/portugalDistricts', () => {
  it('contém os 20 distritos e regiões autónomas de Portugal', () => {
    const districts = getPortugalDistricts();
    expect(districts.length).toBe(20);
    expect(districts).toContain('Faro');
    expect(districts).toContain('Lisboa');
    expect(districts).toContain('Porto');
    expect(districts).toContain('Região Autónoma dos Açores');
    expect(districts).toContain('Região Autónoma da Madeira');
  });

  it('contém exatamente 308 concelhos oficiais no total', () => {
    const totalCounties = PORTUGAL_DISTRICTS.reduce((acc, d) => acc + d.counties.length, 0);
    expect(totalCounties).toBe(308);
  });

  it('devolve os 16 concelhos corretos para o Distrito de Faro (Algarve)', () => {
    const faroCounties = getCountiesForDistrict('Faro');
    expect(faroCounties.length).toBe(16);
    expect(faroCounties).toContain('Faro');
    expect(faroCounties).toContain('Portimão');
    expect(faroCounties).toContain('Olhão');
    expect(faroCounties).toContain('Loulé');
    expect(faroCounties).toContain('Lagos');
    expect(faroCounties).toContain('Albufeira');
    expect(faroCounties).toContain('Silves');
  });

  it('devolve fallback vazio para distrito desconhecido', () => {
    const unknown = getCountiesForDistrict('Inexistente');
    expect(unknown).toEqual([]);
  });
});
