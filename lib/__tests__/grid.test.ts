import { describe, it, expect, beforeEach } from 'vitest';
import {
  GRID_COLS,
  GRID_ROWS,
  createEmptyCell,
  createGrid,
  mouseToGridCoord,
  isValidCoord,
  getCell,
  setCell,
  updateCell,
  isCellEmpty,
  resetGrid,
  forEachCell,
  countCellsByState,
  getNeighbors,
} from '@/lib/grid';
import type { Grid } from '@/types/simulation';

describe('grid module', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = createGrid();
  });

  describe('createEmptyCell', () => {
    it('cria uma célula vazia com idade 0 e sem tipoPlanta', () => {
      const cell = createEmptyCell();
      expect(cell).toEqual({ estado: 'empty', idade: 0 });
      expect(cell.tipoPlanta).toBeUndefined();
    });
  });

  describe('createGrid', () => {
    it('cria grid com dimensões padrão (24 linhas x 32 colunas) totalmente vazio', () => {
      expect(grid.length).toBe(GRID_ROWS);
      expect(grid[0].length).toBe(GRID_COLS);

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          expect(grid[r][c]).toEqual({ estado: 'empty', idade: 0 });
        }
      }
    });

    it('cria grid com dimensões customizadas', () => {
      const customGrid = createGrid(5, 10);
      expect(customGrid.length).toBe(5);
      expect(customGrid[0].length).toBe(10);
      expect(customGrid[4][9]).toEqual({ estado: 'empty', idade: 0 });
    });

    it('garante que cada célula é uma instância de objeto independente', () => {
      grid[0][0].estado = 'seed';
      expect(grid[0][1].estado).toBe('empty');
      expect(grid[1][0].estado).toBe('empty');
    });
  });

  describe('isValidCoord', () => {
    it('retorna true para coordenadas dentro dos limites', () => {
      expect(isValidCoord(grid, { row: 0, col: 0 })).toBe(true);
      expect(isValidCoord(grid, { row: GRID_ROWS - 1, col: GRID_COLS - 1 })).toBe(true);
      expect(isValidCoord(grid, { row: 10, col: 15 })).toBe(true);
    });

    it('retorna false para coordenadas com índices negativos', () => {
      expect(isValidCoord(grid, { row: -1, col: 0 })).toBe(false);
      expect(isValidCoord(grid, { row: 0, col: -1 })).toBe(false);
      expect(isValidCoord(grid, { row: -5, col: -5 })).toBe(false);
    });

    it('retorna false para coordenadas fora dos limites máximos', () => {
      expect(isValidCoord(grid, { row: GRID_ROWS, col: 0 })).toBe(false);
      expect(isValidCoord(grid, { row: 0, col: GRID_COLS })).toBe(false);
      expect(isValidCoord(grid, { row: GRID_ROWS + 10, col: GRID_COLS + 10 })).toBe(false);
    });
  });

  describe('getCell', () => {
    it('retorna a célula correta para coordenadas válidas', () => {
      grid[2][3] = { estado: 'sprout', idade: 5, tipoPlanta: 'bryophyte' };
      const cell = getCell(grid, { row: 2, col: 3 });
      expect(cell).toEqual({ estado: 'sprout', idade: 5, tipoPlanta: 'bryophyte' });
    });

    it('retorna null para coordenadas fora dos limites', () => {
      expect(getCell(grid, { row: -1, col: 5 })).toBeNull();
      expect(getCell(grid, { row: 5, col: -1 })).toBeNull();
      expect(getCell(grid, { row: GRID_ROWS, col: 0 })).toBeNull();
      expect(getCell(grid, { row: 0, col: GRID_COLS })).toBeNull();
    });
  });

  describe('setCell', () => {
    it('sobrescreve célula existente e retorna true', () => {
      const novaCelula = { estado: 'mature' as const, idade: 12, tipoPlanta: 'angiosperm' as const };
      const success = setCell(grid, { row: 4, col: 7 }, novaCelula);

      expect(success).toBe(true);
      expect(getCell(grid, { row: 4, col: 7 })).toEqual(novaCelula);
    });

    it('retorna false para coordenadas inválidas sem causar efeito colateral', () => {
      const novaCelula = { estado: 'bloom' as const, idade: 20 };
      const success = setCell(grid, { row: -1, col: 0 }, novaCelula);

      expect(success).toBe(false);
      expect(countCellsByState(grid, 'bloom')).toBe(0);
    });
  });

  describe('updateCell', () => {
    it('faz merge parcial preservando campos não informados', () => {
      setCell(grid, { row: 3, col: 3 }, { estado: 'sprout', idade: 4, tipoPlanta: 'gymnosperm' });

      const success = updateCell(grid, { row: 3, col: 3 }, { estado: 'mature', idade: 5 });
      expect(success).toBe(true);

      const cell = getCell(grid, { row: 3, col: 3 });
      expect(cell).toEqual({
        estado: 'mature',
        idade: 5,
        tipoPlanta: 'gymnosperm',
      });
    });

    it('retorna false para coordenadas inválidas', () => {
      const success = updateCell(grid, { row: 99, col: 99 }, { estado: 'seed' });
      expect(success).toBe(false);
    });
  });

  describe('isCellEmpty', () => {
    it('retorna true para célula com estado empty', () => {
      expect(isCellEmpty({ estado: 'empty', idade: 0 })).toBe(true);
    });

    it('retorna false para outros estados', () => {
      expect(isCellEmpty({ estado: 'seed', idade: 0 })).toBe(false);
      expect(isCellEmpty({ estado: 'sprout', idade: 1 })).toBe(false);
      expect(isCellEmpty({ estado: 'mature', idade: 10 })).toBe(false);
      expect(isCellEmpty({ estado: 'bloom', idade: 15 })).toBe(false);
    });
  });

  describe('resetGrid', () => {
    it('reseta todas as células para estado empty in-place', () => {
      setCell(grid, { row: 0, col: 0 }, { estado: 'seed', idade: 1 });
      setCell(grid, { row: 5, col: 5 }, { estado: 'mature', idade: 10, tipoPlanta: 'bryophyte' });
      setCell(grid, { row: 10, col: 10 }, { estado: 'bloom', idade: 20 });

      expect(countCellsByState(grid, 'empty')).toBe(GRID_ROWS * GRID_COLS - 3);

      resetGrid(grid);

      expect(countCellsByState(grid, 'empty')).toBe(GRID_ROWS * GRID_COLS);
      forEachCell(grid, (cell) => {
        expect(cell).toEqual({ estado: 'empty', idade: 0 });
      });
    });
  });

  describe('forEachCell', () => {
    it('visita todas as células na ordem row-major', () => {
      let visitedCount = 0;
      const visitedCoords: Array<{ row: number; col: number }> = [];

      forEachCell(grid, (_cell, row, col) => {
        visitedCount++;
        visitedCoords.push({ row, col });
      });

      expect(visitedCount).toBe(GRID_ROWS * GRID_COLS);
      expect(visitedCoords[0]).toEqual({ row: 0, col: 0 });
      expect(visitedCoords[GRID_COLS - 1]).toEqual({ row: 0, col: GRID_COLS - 1 });
      expect(visitedCoords[visitedCoords.length - 1]).toEqual({
        row: GRID_ROWS - 1,
        col: GRID_COLS - 1,
      });
    });
  });

  describe('countCellsByState', () => {
    it('conta corretamente células por estado', () => {
      expect(countCellsByState(grid, 'empty')).toBe(GRID_ROWS * GRID_COLS);
      expect(countCellsByState(grid, 'seed')).toBe(0);

      setCell(grid, { row: 1, col: 1 }, { estado: 'seed', idade: 0 });
      setCell(grid, { row: 2, col: 2 }, { estado: 'seed', idade: 1 });
      setCell(grid, { row: 3, col: 3 }, { estado: 'sprout', idade: 3 });

      expect(countCellsByState(grid, 'seed')).toBe(2);
      expect(countCellsByState(grid, 'sprout')).toBe(1);
      expect(countCellsByState(grid, 'empty')).toBe(GRID_ROWS * GRID_COLS - 3);
    });
  });

  describe('getNeighbors', () => {
    it('retorna 8 vizinhos para uma célula central', () => {
      const neighbors = getNeighbors(grid, { row: 5, col: 5 });
      expect(neighbors.length).toBe(8);

      const coords = neighbors.map((n) => `${n.coord.row},${n.coord.col}`);
      expect(coords).toContain('4,4');
      expect(coords).toContain('4,5');
      expect(coords).toContain('4,6');
      expect(coords).toContain('5,4');
      expect(coords).toContain('5,6');
      expect(coords).toContain('6,4');
      expect(coords).toContain('6,5');
      expect(coords).toContain('6,6');
      expect(coords).not.toContain('5,5');
    });

    it('retorna 3 vizinhos para células de canto', () => {
      const topLeft = getNeighbors(grid, { row: 0, col: 0 });
      expect(topLeft.length).toBe(3);
      const topLeftCoords = topLeft.map((n) => `${n.coord.row},${n.coord.col}`);
      expect(topLeftCoords).toEqual(expect.arrayContaining(['0,1', '1,0', '1,1']));

      const bottomRight = getNeighbors(grid, { row: GRID_ROWS - 1, col: GRID_COLS - 1 });
      expect(bottomRight.length).toBe(3);
    });

    it('retorna 5 vizinhos para células na borda (não-canto)', () => {
      const topEdge = getNeighbors(grid, { row: 0, col: 5 });
      expect(topEdge.length).toBe(5);

      const leftEdge = getNeighbors(grid, { row: 5, col: 0 });
      expect(leftEdge.length).toBe(5);
    });
  });

  describe('mouseToGridCoord', () => {
    it('converte coordenadas de pixels para índices col e row corretos', () => {
      // CELL_SIZE = 20
      // Pixel (0, 0) -> col 0, row 0
      expect(mouseToGridCoord(0, 0)).toEqual({ col: 0, row: 0 });
      // Pixel (25, 45) -> col 1, row 2
      expect(mouseToGridCoord(25, 45)).toEqual({ col: 1, row: 2 });
      // Pixel no limite inferior direito (639, 479) -> col 31, row 23
      expect(mouseToGridCoord(639, 479)).toEqual({ col: 31, row: 23 });
    });

    it('retorna null para coordenadas fora do canvas', () => {
      expect(mouseToGridCoord(-1, 50)).toBeNull();
      expect(mouseToGridCoord(50, -1)).toBeNull();
      expect(mouseToGridCoord(640, 100)).toBeNull(); // 640 >= 32 * 20
      expect(mouseToGridCoord(100, 480)).toBeNull(); // 480 >= 24 * 20
    });

    it('aceita dimensões customizadas', () => {
      const customDims = { cols: 10, rows: 10, cellSize: 10 };
      expect(mouseToGridCoord(15, 25, customDims)).toEqual({ col: 1, row: 2 });
      expect(mouseToGridCoord(100, 50, customDims)).toBeNull();
    });
  });
});
