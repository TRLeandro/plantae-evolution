import { describe, it, expect, beforeEach } from 'vitest';
import {
  advanceCell,
  advanceGrid,
  TICKS_SEED_TO_SPROUT,
  TICKS_SPROUT_TO_MATURE,
  TICKS_MATURE_TO_BLOOM,
  TICKS_BLOOM_DURATION,
} from '@/lib/lifecycle';
import { SPECIES_CATALOG } from '@/lib/species';
import { createGrid, getCell, setCell } from '@/lib/grid';
import type { Cell, Grid } from '@/types/simulation';

describe('lifecycle module', () => {
  describe('advanceCell (padrão / fallback sem espécie)', () => {
    it('célula vazia permanece vazia e sem alteração de idade', () => {
      const cell: Cell = { estado: 'empty', idade: 0 };
      advanceCell(cell);
      expect(cell.estado).toBe('empty');
      expect(cell.idade).toBe(0);
    });

    it('semente sem tipoPlanta usa TICKS_SEED_TO_SPROUT padrão e transiciona para sprout', () => {
      const cell: Cell = { estado: 'seed', idade: 0 };

      for (let i = 1; i < TICKS_SEED_TO_SPROUT; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('seed');
        expect(cell.idade).toBe(i);
      }

      advanceCell(cell);
      expect(cell.estado).toBe('sprout');
      expect(cell.idade).toBe(0);
    });

    it('broto sem tipoPlanta usa TICKS_SPROUT_TO_MATURE padrão e transiciona para mature', () => {
      const cell: Cell = { estado: 'sprout', idade: 0 };

      for (let i = 1; i < TICKS_SPROUT_TO_MATURE; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('sprout');
        expect(cell.idade).toBe(i);
      }

      advanceCell(cell);
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('planta madura sem tipoPlanta transiciona após TICKS_MATURE_TO_BLOOM e retorna após TICKS_BLOOM_DURATION', () => {
      const cell: Cell = { estado: 'mature', idade: 0 };

      for (let i = 1; i < TICKS_MATURE_TO_BLOOM; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('mature');
        expect(cell.idade).toBe(i);
      }

      advanceCell(cell);
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(0);

      for (let i = 1; i < TICKS_BLOOM_DURATION; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('bloom');
        expect(cell.idade).toBe(i);
      }

      advanceCell(cell);
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });
  });

  describe('advanceCell (comportamento específico por espécie - Sprint 2)', () => {
    it('briófita avança com ritmo acelerado definido no catálogo (12, 18, 16, 10 ticks)', () => {
      const sp = SPECIES_CATALOG.bryophyte;
      const cell: Cell = { estado: 'seed', tipoPlanta: 'bryophyte', idade: 0 };

      // Seed -> Sprout (12 ticks)
      for (let i = 0; i < sp.ticksSeedToSprout; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('sprout');
      expect(cell.idade).toBe(0);

      // Sprout -> Mature (18 ticks)
      for (let i = 0; i < sp.ticksSproutToMature; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);

      // Mature -> Bloom (16 ticks)
      for (let i = 0; i < sp.ticksMatureToBloom; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(0);

      // Bloom -> Mature (10 ticks)
      for (let i = 0; i < sp.ticksBloomDuration; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('gimnosperma avança com ritmo longevo/lento (20, 30, 24, 6 ticks)', () => {
      const sp = SPECIES_CATALOG.gymnosperm;
      const cell: Cell = { estado: 'seed', tipoPlanta: 'gymnosperm', idade: 0 };

      // Seed -> Sprout (20 ticks)
      for (let i = 0; i < sp.ticksSeedToSprout; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('sprout');
      expect(cell.idade).toBe(0);

      // Sprout -> Mature (30 ticks)
      for (let i = 0; i < sp.ticksSproutToMature; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);

      // Mature -> Bloom (24 ticks)
      for (let i = 0; i < sp.ticksMatureToBloom; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(0);

      // Bloom -> Mature (6 ticks)
      for (let i = 0; i < sp.ticksBloomDuration; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('pteridófita avança com ritmo intermediário-rápido (14, 20, 18, 8 ticks)', () => {
      const sp = SPECIES_CATALOG.pteridophyte;
      const cell: Cell = { estado: 'seed', tipoPlanta: 'pteridophyte', idade: 0 };

      // Seed -> Sprout (14 ticks)
      for (let i = 0; i < sp.ticksSeedToSprout; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('sprout');
      expect(cell.idade).toBe(0);

      // Sprout -> Mature (20 ticks)
      for (let i = 0; i < sp.ticksSproutToMature; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);

      // Mature -> Bloom (18 ticks)
      for (let i = 0; i < sp.ticksMatureToBloom; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(0);

      // Bloom -> Mature (8 ticks)
      for (let i = 0; i < sp.ticksBloomDuration; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('angiosperma avança com ritmo intermediário (16, 24, 20, 8 ticks)', () => {
      const sp = SPECIES_CATALOG.angiosperm;
      const cell: Cell = { estado: 'seed', tipoPlanta: 'angiosperm', idade: 0 };

      // Seed -> Sprout (16 ticks)
      for (let i = 0; i < sp.ticksSeedToSprout; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('sprout');
      expect(cell.idade).toBe(0);

      // Sprout -> Mature (24 ticks)
      for (let i = 0; i < sp.ticksSproutToMature; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);

      // Mature -> Bloom (20 ticks)
      for (let i = 0; i < sp.ticksMatureToBloom; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(0);

      // Bloom -> Mature (8 ticks)
      for (let i = 0; i < sp.ticksBloomDuration; i++) {
        advanceCell(cell);
      }
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('aceita parâmetros customizados de ticks sobrepondo a espécie', () => {
      const cell: Cell = { estado: 'seed', tipoPlanta: 'gymnosperm', idade: 0 };
      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.estado).toBe('seed');
      expect(cell.idade).toBe(1);

      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.estado).toBe('sprout');
      expect(cell.idade).toBe(0);

      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.idade).toBe(1);
      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.idade).toBe(2);
      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('planta madura alterna indefinidamente entre mature e bloom em ciclos múltiplos', () => {
      const sp = SPECIES_CATALOG.bryophyte;
      const cell: Cell = { estado: 'mature', tipoPlanta: 'bryophyte', idade: 0 };

      // Executa 3 ciclos completos mature -> bloom -> mature
      for (let ciclo = 0; ciclo < 3; ciclo++) {
        for (let i = 0; i < sp.ticksMatureToBloom; i++) {
          advanceCell(cell);
        }
        expect(cell.estado).toBe('bloom');

        for (let i = 0; i < sp.ticksBloomDuration; i++) {
          advanceCell(cell);
        }
        expect(cell.estado).toBe('mature');
      }
    });
  });

  describe('advanceGrid', () => {
    let grid: Grid;

    beforeEach(() => {
      grid = createGrid(5, 5);
    });

    it('avança apenas células com plantas e preserva células vazias', () => {
      setCell(grid, { row: 1, col: 1 }, { estado: 'seed', idade: 0 });
      setCell(grid, { row: 2, col: 2 }, { estado: 'sprout', idade: 0 });

      // Avança 1 tick
      advanceGrid(grid, 2, 3);

      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('empty');
      expect(getCell(grid, { row: 1, col: 1 })?.idade).toBe(1);
      expect(getCell(grid, { row: 1, col: 1 })?.estado).toBe('seed');
      expect(getCell(grid, { row: 2, col: 2 })?.idade).toBe(1);
      expect(getCell(grid, { row: 2, col: 2 })?.estado).toBe('sprout');

      // Avança mais 1 tick (seed -> sprout)
      advanceGrid(grid, 2, 3);
      expect(getCell(grid, { row: 1, col: 1 })?.estado).toBe('sprout');
      expect(getCell(grid, { row: 1, col: 1 })?.idade).toBe(0);
    });

    it('completa ciclo completo no grid semente → broto → madura e alterna ciclicamente', () => {
      setCell(grid, { row: 0, col: 0 }, { estado: 'seed', tipoPlanta: 'angiosperm', idade: 0 });
      const sp = SPECIES_CATALOG.angiosperm;

      // Avança ticks (semente -> broto)
      for (let i = 0; i < sp.ticksSeedToSprout; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('sprout');

      // Avança ticks (broto -> madura)
      for (let i = 0; i < sp.ticksSproutToMature; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('mature');

      // Avança ticks (mature -> bloom)
      for (let i = 0; i < sp.ticksMatureToBloom; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('bloom');

      // Avança ticks (bloom -> mature)
      for (let i = 0; i < sp.ticksBloomDuration; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('mature');
    });
  });
});
