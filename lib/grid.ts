/**
 * Plantae Evolution — Configuração e Tipos da Matriz (Grid)
 *
 * Define as constantes do grid e funções utilitárias para
 * criar, manipular e mapear coordenadas na matriz do autômato celular.
 */

import type { Cell, GridCoord, GridDimensions } from '@/types/simulation';
export type { Cell, CellState, PlantType, GridCoord, GridDimensions, CellClickEvent } from '@/types/simulation';

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
export function createGrid(rows: number = GRID_ROWS, cols: number = GRID_COLS): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createEmptyCell()),
  );
}

// ---------------------------------------------------------------------------
// Utilitários de Coordenadas
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
