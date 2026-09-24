/**
 * Plantae Evolution — Tipagens da Simulação
 *
 * Estruturas de dados da matriz celular e eventos do grid interativo.
 * Referência: AGENTS.md § 4.1 (Estrutura de Dados da Matriz)
 */

/** Estados possíveis de uma célula na matriz */
export type CellState = 'empty' | 'seed' | 'sprout' | 'mature' | 'bloom';

/** Espécies vegetais disponíveis na simulação */
export type PlantType = 'bryophyte' | 'gymnosperm' | 'angiosperm';

/**
 * Representa uma célula individual na grade da simulação.
 * Cada célula pode estar vazia ou ocupada por uma planta em algum
 * estágio do seu ciclo ontogenético.
 */
export interface Cell {
  /** Estado atual da célula no ciclo de vida */
  estado: CellState;
  /** Espécie da planta ocupando a célula (undefined se vazia) */
  tipoPlanta?: PlantType;
  /** Ticks de vida acumulados na fase atual */
  idade: number;
}

/** Representação canônica da matriz bidimensional do autômato celular */
export type Grid = Cell[][];

/** Coordenada de uma célula na grade */
export interface GridCoord {
  col: number;
  row: number;
}

/** Dimensões da grade da simulação */
export interface GridDimensions {
  cols: number;
  rows: number;
  cellSize: number;
}

/** Evento de clique em uma célula do grid */
export interface CellClickEvent {
  coord: GridCoord;
  cell: Cell;
}
