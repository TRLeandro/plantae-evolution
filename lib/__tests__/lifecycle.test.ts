import { describe, it, expect, beforeEach } from 'vitest';
import {
  advanceCell,
  advanceGrid,
  TICKS_SEED_TO_SPROUT,
  TICKS_SPROUT_TO_MATURE,
  TICKS_MATURE_TO_BLOOM,
  TICKS_BLOOM_DURATION,
} from '@/lib/lifecycle';
import { createGrid, getCell, setCell } from '@/lib/grid';
import type { Cell, Grid } from '@/types/simulation';

describe('lifecycle module', () => {
  describe('advanceCell', () => {
    it('célula vazia permanece vazia e sem alteração de idade', () => {
      const cell: Cell = { estado: 'empty', idade: 0 };
      advanceCell(cell);
      expect(cell.estado).toBe('empty');
      expect(cell.idade).toBe(0);
    });

    it('semente incrementa idade até atingir TICKS_SEED_TO_SPROUT e transiciona para sprout', () => {
      const cell: Cell = { estado: 'seed', tipoPlanta: 'bryophyte', idade: 0 };

      // Avança até o tick anterior à transição
      for (let i = 1; i < TICKS_SEED_TO_SPROUT; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('seed');
        expect(cell.idade).toBe(i);
      }

      // No tick de transição, torna-se sprout e reseta idade para 0
      advanceCell(cell);
      expect(cell.estado).toBe('sprout');
      expect(cell.idade).toBe(0);
      expect(cell.tipoPlanta).toBe('bryophyte');
    });

    it('broto incrementa idade até atingir TICKS_SPROUT_TO_MATURE e transiciona para mature', () => {
      const cell: Cell = { estado: 'sprout', tipoPlanta: 'bryophyte', idade: 0 };

      // Avança até o tick anterior à transição
      for (let i = 1; i < TICKS_SPROUT_TO_MATURE; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('sprout');
        expect(cell.idade).toBe(i);
      }

      // No tick de transição, torna-se mature e reseta idade para 0
      advanceCell(cell);
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
      expect(cell.tipoPlanta).toBe('bryophyte');
    });

    it('planta madura transiciona para bloom após TICKS_MATURE_TO_BLOOM e retorna para mature após TICKS_BLOOM_DURATION', () => {
      const cell: Cell = { estado: 'mature', tipoPlanta: 'bryophyte', idade: 0 };

      // Avança até o tick anterior à transição
      for (let i = 1; i < TICKS_MATURE_TO_BLOOM; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('mature');
        expect(cell.idade).toBe(i);
      }

      // No tick de florescência, transiciona para bloom e zera a idade
      advanceCell(cell);
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(0);

      // Avança no estado bloom até a duração expirar
      for (let i = 1; i < TICKS_BLOOM_DURATION; i++) {
        advanceCell(cell);
        expect(cell.estado).toBe('bloom');
        expect(cell.idade).toBe(i);
      }

      // No término do bloom, retorna para mature
      advanceCell(cell);
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('aceita parâmetros customizados de ticks para testes ou cenários dinâmicos', () => {
      const cell: Cell = { estado: 'seed', idade: 0 };
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

      // mature -> bloom com parâmetro customizado (2 ticks)
      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(1);
      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(0);

      // bloom -> mature com parâmetro customizado (2 ticks)
      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.estado).toBe('bloom');
      expect(cell.idade).toBe(1);
      advanceCell(cell, 2, 3, 2, 2);
      expect(cell.estado).toBe('mature');
      expect(cell.idade).toBe(0);
    });

    it('planta madura alterna indefinidamente entre mature e bloom em ciclos múltiplos', () => {
      const cell: Cell = { estado: 'mature', tipoPlanta: 'bryophyte', idade: 0 };

      // Executa 3 ciclos completos mature -> bloom -> mature
      for (let ciclo = 0; ciclo < 3; ciclo++) {
        for (let i = 0; i < TICKS_MATURE_TO_BLOOM; i++) {
          advanceCell(cell);
        }
        expect(cell.estado).toBe('bloom');

        for (let i = 0; i < TICKS_BLOOM_DURATION; i++) {
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
      setCell(grid, { row: 1, col: 1 }, { estado: 'seed', tipoPlanta: 'bryophyte', idade: 0 });
      setCell(grid, { row: 2, col: 2 }, { estado: 'sprout', tipoPlanta: 'bryophyte', idade: 0 });

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
      setCell(grid, { row: 0, col: 0 }, { estado: 'seed', tipoPlanta: 'bryophyte', idade: 0 });

      // Avança 16 ticks (semente -> broto)
      for (let i = 0; i < TICKS_SEED_TO_SPROUT; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('sprout');

      // Avança mais 24 ticks (broto -> madura)
      for (let i = 0; i < TICKS_SPROUT_TO_MATURE; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('mature');

      // Avança 20 ticks (mature -> bloom)
      for (let i = 0; i < TICKS_MATURE_TO_BLOOM; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('bloom');

      // Avança 8 ticks (bloom -> mature)
      for (let i = 0; i < TICKS_BLOOM_DURATION; i++) {
        advanceGrid(grid);
      }
      expect(getCell(grid, { row: 0, col: 0 })?.estado).toBe('mature');
    });
  });
});
