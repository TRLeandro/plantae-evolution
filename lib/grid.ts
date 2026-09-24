/**
 * Plantae Evolution — Configuração e Tipos da Matriz (Grid)
 *
 * Define as constantes do grid e funções utilitárias para
 * criar, manipular e mapear coordenadas na matriz do autômato celular.
 */

import type { Cell, CellState, Grid, GridCoord, GridDimensions } from '@/types/simulation';
export type { Cell, CellState, PlantType, Grid, GridCoord, GridDimensions, CellClickEvent } from '@/types/simulation';

// ---------------------------------------------------------------------------
// Constantes de Dimensão do Grid (Fase 1: MVP)
// ---------------------------------------------------------------------------

/** Tamanho de cada célula em pixels. */
export const CELL_SIZE = 20;

/** Número de colunas da matriz. */
export const GRID_COLS = 32;

/** Número de linhas da matriz. */
export const GRID_ROWS = 24;

/** Largura total do canvas em pixels (32 * 20 = 640). */
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;

/** Altura total do canvas em pixels (24 * 20 = 480). */
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

// ---------------------------------------------------------------------------
// Fábrica de Células e Matriz
// ---------------------------------------------------------------------------

/** Cria uma célula vazia (estado inicial). */
export function createEmptyCell(): Cell {
  return { estado: 'empty', idade: 0 };
}

/** Cria a matriz bidimensional completa, inicializada com células vazias. */
export function createGrid(rows: number = GRID_ROWS, cols: number = GRID_COLS): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createEmptyCell()),
  );
}

// ---------------------------------------------------------------------------
// Utilitários de Coordenadas e Acesso
// ---------------------------------------------------------------------------

/**
 * Converte coordenadas de pixel (X, Y) do mouse em índices de matriz (col, row).
 * Retorna null se a posição estiver fora dos limites do grid.
 */
export function mouseToGridCoord(
  mouseX: number,
  mouseY: number,
  dims: GridDimensions = { cols: GRID_COLS, rows: GRID_ROWS, cellSize: CELL_SIZE },
): GridCoord | null {
  const col = Math.floor(mouseX / dims.cellSize);
  const row = Math.floor(mouseY / dims.cellSize);

  if (col < 0 || col >= dims.cols || row < 0 || row >= dims.rows) {
    return null;
  }

  return { col, row };
}

/** Verifica se a coordenada está dentro dos limites da matriz. */
export function isValidCoord(grid: Grid, coord: GridCoord): boolean {
  return (
    coord.row >= 0 &&
    coord.row < grid.length &&
    coord.col >= 0 &&
    coord.col < (grid[coord.row]?.length ?? 0)
  );
}

/** Retorna a célula na coordenada informada ou null se estiver fora dos limites. */
export function getCell(grid: Grid, coord: GridCoord): Cell | null {
  if (!isValidCoord(grid, coord)) {
    return null;
  }
  return grid[coord.row][coord.col];
}

/** Sobrescreve a célula em (row, col). Retorna false se fora dos limites. */
export function setCell(grid: Grid, coord: GridCoord, cell: Cell): boolean {
  if (!isValidCoord(grid, coord)) {
    return false;
  }
  grid[coord.row][coord.col] = cell;
  return true;
}

/** Aplica alterações parciais à célula existente (merge in-place). Retorna false se fora dos limites. */
export function updateCell(grid: Grid, coord: GridCoord, partial: Partial<Cell>): boolean {
  const cell = getCell(grid, coord);
  if (!cell) {
    return false;
  }
  Object.assign(cell, partial);
  return true;
}

/** Verifica se a célula está em estado vazio. */
export function isCellEmpty(cell: Cell): boolean {
  return cell.estado === 'empty';
}

/** Reseta todas as células do grid para o estado vazio (mutação in-place). */
export function resetGrid(grid: Grid): void {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      grid[row][col] = createEmptyCell();
    }
  }
}

/** Itera por todas as células da matriz. */
export function forEachCell(
  grid: Grid,
  callback: (cell: Cell, row: number, col: number) => void,
): void {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      callback(grid[row][col], row, col);
    }
  }
}

/** Conta quantas células possuem o estado fornecido. */
export function countCellsByState(grid: Grid, state: CellState): number {
  let count = 0;
  forEachCell(grid, (cell) => {
    if (cell.estado === state) {
      count++;
    }
  });
  return count;
}

/**
 * Retorna as células vizinhas válidas (vizinhança de Moore: até 8 células adjacentes).
 */
export function getNeighbors(
  grid: Grid,
  coord: GridCoord,
): Array<{ coord: GridCoord; cell: Cell }> {
  const neighbors: Array<{ coord: GridCoord; cell: Cell }> = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const neighborCoord = { row: coord.row + dy, col: coord.col + dx };
      const neighborCell = getCell(grid, neighborCoord);
      if (neighborCell) {
        neighbors.push({ coord: neighborCoord, cell: neighborCell });
      }
    }
  }

  return neighbors;
}
