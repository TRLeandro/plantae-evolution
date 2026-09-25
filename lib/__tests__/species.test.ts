import { describe, it, expect } from 'vitest';
import {
  SPECIES_CATALOG,
  SPECIES_LIST,
  getSpeciesConfig,
  canDisperseWithAgent,
} from '@/lib/species';
import type { PlantType } from '@/types/simulation';

describe('species module', () => {
  const speciesKeys: PlantType[] = [
    'bryophyte',
    'pteridophyte',
    'gymnosperm',
    'angiosperm',
  ];

  it('possui as 4 espécies canônicas no catálogo', () => {
    expect(Object.keys(SPECIES_CATALOG)).toEqual(
      expect.arrayContaining(speciesKeys),
    );
    expect(SPECIES_LIST).toHaveLength(4);
  });

  it('cada espécie possui identificadores, rótulos e descrições válidas', () => {
    for (const key of speciesKeys) {
      const config = SPECIES_CATALOG[key];
      expect(config.id).toBe(key);
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.description.length).toBeGreaterThan(0);
      expect(config.reproductionLabel.length).toBeGreaterThan(0);
    }
  });

  it('briófita propaga-se por autômato celular e não possui agentes dispersores', () => {
    const bryo = SPECIES_CATALOG.bryophyte;
    expect(bryo.isCellularAutomaton).toBe(true);
    expect(bryo.dispersalAgents).toEqual([]);
    expect(canDisperseWithAgent('bryophyte', 'wind')).toBe(false);
    expect(canDisperseWithAgent('bryophyte', 'bird')).toBe(false);
    expect(canDisperseWithAgent('bryophyte', 'bee')).toBe(false);
  });

  it('pteridófita é dispersa exclusivamente por vento', () => {
    const pteri = SPECIES_CATALOG.pteridophyte;
    expect(pteri.isCellularAutomaton).toBe(false);
    expect(pteri.dispersalAgents).toEqual(['wind']);
    expect(canDisperseWithAgent('pteridophyte', 'wind')).toBe(true);
    expect(canDisperseWithAgent('pteridophyte', 'bird')).toBe(false);
    expect(canDisperseWithAgent('pteridophyte', 'bee')).toBe(false);
  });

  it('gimnosperma é dispersa por vento e pássaro', () => {
    const gymno = SPECIES_CATALOG.gymnosperm;
    expect(gymno.isCellularAutomaton).toBe(false);
    expect(gymno.dispersalAgents).toEqual(['wind', 'bird']);
    expect(canDisperseWithAgent('gymnosperm', 'wind')).toBe(true);
    expect(canDisperseWithAgent('gymnosperm', 'bird')).toBe(true);
    expect(canDisperseWithAgent('gymnosperm', 'bee')).toBe(false);
  });

  it('angiosperma é dispersa por todos os agentes (vento, pássaro e abelha)', () => {
    const angio = SPECIES_CATALOG.angiosperm;
    expect(angio.isCellularAutomaton).toBe(false);
    expect(angio.dispersalAgents).toEqual(['wind', 'bird', 'bee']);
    expect(canDisperseWithAgent('angiosperm', 'wind')).toBe(true);
    expect(canDisperseWithAgent('angiosperm', 'bird')).toBe(true);
    expect(canDisperseWithAgent('angiosperm', 'bee')).toBe(true);
  });

  it('cada espécie possui ritmos ontogenéticos distintos e válidos (ticks > 0)', () => {
    for (const key of speciesKeys) {
      const config = SPECIES_CATALOG[key];
      expect(config.ticksSeedToSprout).toBeGreaterThan(0);
      expect(config.ticksSproutToMature).toBeGreaterThan(0);
      expect(config.ticksMatureToBloom).toBeGreaterThan(0);
      expect(config.ticksBloomDuration).toBeGreaterThan(0);
    }

    // Valida diferenciação do tempo total até maturidade (seed -> mature)
    const bryophyteMaturity =
      SPECIES_CATALOG.bryophyte.ticksSeedToSprout +
      SPECIES_CATALOG.bryophyte.ticksSproutToMature;
    const pteridophyteMaturity =
      SPECIES_CATALOG.pteridophyte.ticksSeedToSprout +
      SPECIES_CATALOG.pteridophyte.ticksSproutToMature;
    const angiospermMaturity =
      SPECIES_CATALOG.angiosperm.ticksSeedToSprout +
      SPECIES_CATALOG.angiosperm.ticksSproutToMature;
    const gymnospermMaturity =
      SPECIES_CATALOG.gymnosperm.ticksSeedToSprout +
      SPECIES_CATALOG.gymnosperm.ticksSproutToMature;

    expect(bryophyteMaturity).toBe(30);
    expect(pteridophyteMaturity).toBe(34);
    expect(angiospermMaturity).toBe(40);
    expect(gymnospermMaturity).toBe(50);
  });

  it('cada espécie possui cores hexadecimais válidas para fase madura e reprodutiva', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    for (const key of speciesKeys) {
      const config = SPECIES_CATALOG[key];
      expect(config.colorMature).toMatch(hexRegex);
      expect(config.colorReproductive).toMatch(hexRegex);
      expect(config.colorMature).not.toBe(config.colorReproductive);
    }
  });

  it('getSpeciesConfig retorna a configuração correta para cada tipo de planta', () => {
    for (const key of speciesKeys) {
      const config = getSpeciesConfig(key);
      expect(config).toBe(SPECIES_CATALOG[key]);
    }
  });
});
