/**
 * Plantae Evolution — Configuração e Tipos da Matriz (Grid)
 *
 * Define as constantes do grid, a interface Cell e funções
 * utilitárias para criar e manipular a matriz do autômato celular.
 */

// ---------------------------------------------------------------------------
// Tipos de Domínio
// ---------------------------------------------------------------------------

/** Estados possíveis de uma célula do autômato. */
export type CellState = 'empty' | 'seed' | 'sprout' | 'mature' | 'bloom';

/** Espécies de plantas (Fase 2 — Sprint 2). */
export type PlantType = 'bryophyte' | 'gymnosperm' | 'angiosperm';

/** Representa uma célula individual da matriz. */
export interface Cell {
  estado: CellState;
  tipoPlanta?: PlantType;
  idade: number; // Ticks de vida na fase atual
}

// ---------------------------------------------------------------------------
// Constantes de Dimensão do Grid
// ---------------------------------------------------------------------------

/** Tamanho de cada célula em pixels. */
export const CELL_SIZE = 16;

/** Número de colunas da matriz. */
export const GRID_COLS = 50;

/** Número de linhas da matriz. */
export const GRID_ROWS = 35;

// ---------------------------------------------------------------------------
// Fábrica de Células e Matriz
// ---------------------------------------------------------------------------

/** Cria uma célula vazia (estado inicial). */
export function createEmptyCell(): Cell {
  return { estado: 'empty', idade: 0 };
}

/** Cria a matriz bidimensional completa, inicializada com células vazias. */
export function createGrid(): Cell[][] {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => createEmptyCell()),
  );
}
