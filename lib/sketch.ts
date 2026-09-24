/**
 * Plantae Evolution — Sketch p5.js (Modo Instância)
 *
 * Motor gráfico do canvas do autômato celular.
 * Renderiza o terreno, células nos diferentes estágios ontogenéticos,
 * linhas da grade e destaque do cursor (hover).
 *
 * Gerencia eventos de entrada do mouse e mapeia cliques para coordenadas (linha, coluna).
 *
 * ⚠️ Este módulo executa APENAS no cliente (importado dinamicamente).
 */

import type p5 from 'p5';
import { PALETTE, hexToRgb } from '@/lib/colors';
import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  createGrid,
  mouseToGridCoord,
} from '@/lib/grid';
import type { Cell, CellState, GridCoord } from '@/types/simulation';

export { CANVAS_WIDTH, CANVAS_HEIGHT };

// Cores pré-computadas (evita hexToRgb repetitivo a cada frame no draw)
const BG_RGB = hexToRgb(PALETTE.ui.background);
const LINES_RGB = hexToRgb(PALETTE.grid.lines);
const HOVER_RGB = hexToRgb(PALETTE.grid.hover);

const STATE_COLOR: Record<CellState, readonly [number, number, number]> = {
  empty: hexToRgb(PALETTE.grid.empty),
  seed: hexToRgb(PALETTE.stages.seed),
  sprout: hexToRgb(PALETTE.stages.sprout),
  mature: hexToRgb(PALETTE.stages.mature),
  bloom: hexToRgb(PALETTE.stages.bloom),
};

export interface SketchOptions {
  /** Callback disparado ao clicar em uma célula válida */
  onCellClick?: (coord: GridCoord, cell: Cell) => void;
}

/**
 * Cria a função sketch no formato de instância do p5 (`new p5(sketch, container)`).
 * Recebe opções como callbacks para comunicar eventos com a camada React de forma desacoplada.
 */
export function createSketch(options?: SketchOptions) {
  return (p: p5) => {
    // Matriz de células interna do motor de simulação (fora do ciclo de render do React)
    const grid: Cell[][] = createGrid();
    let hoverCoord: GridCoord | null = null;

    // ----- setup -----
    p.setup = () => {
      const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
      canvas.style('display', 'block');
      p.frameRate(60);
    };

    // ----- draw -----
    p.draw = () => {
      p.background(...BG_RGB);

      // 1. Renderiza o preenchimento de cada célula
      p.noStroke();
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const cell = grid[row][col];
          const isHover =
            hoverCoord !== null &&
            hoverCoord.col === col &&
            hoverCoord.row === row;

          if (isHover && cell.estado === 'empty') {
            p.fill(...HOVER_RGB);
          } else {
            p.fill(...STATE_COLOR[cell.estado]);
          }

          p.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }

      // 2. Renderiza linhas da grade por cima
      p.stroke(...LINES_RGB);
      p.strokeWeight(1);

      // Linhas verticais
      for (let col = 0; col <= GRID_COLS; col++) {
        const x = col * CELL_SIZE;
        p.line(x, 0, x, CANVAS_HEIGHT);
      }

      // Linhas horizontais
      for (let row = 0; row <= GRID_ROWS; row++) {
        const y = row * CELL_SIZE;
        p.line(0, y, CANVAS_WIDTH, y);
      }
    };

    // ----- Função unificada para tratar interação de clique ou toque -----
    let lastInteractionTime = 0;
    const handleInteraction = (): boolean => {
      const now = Date.now();
      if (now - lastInteractionTime < 250) {
        return false;
      }

      const coord = mouseToGridCoord(p.mouseX, p.mouseY);
      if (!coord) return false;

      lastInteractionTime = now;
      const cell = grid[coord.row][coord.col];

      // Plantio inicial de validação (Sprint 0): célula vazia → semente
      if (cell.estado === 'empty') {
        cell.estado = 'seed';
        cell.idade = 0;
      }

      // Notifica o callback com cópia da célula e coordenadas
      options?.onCellClick?.(coord, { ...cell });
      return true;
    };

    // ----- mouseMoved — atualiza célula sob o cursor -----
    p.mouseMoved = () => {
      hoverCoord = mouseToGridCoord(p.mouseX, p.mouseY);
    };

    // ----- mousePressed — detecta clique e mapeia para índices da matriz -----
    p.mousePressed = () => {
      handleInteraction();
    };

    // ----- touchStarted — suporte direto a dispositivos mobile/touch -----
    p.touchStarted = () => {
      const handled = handleInteraction();
      // Retornar false previne comportamento de scroll e gestos padrão do browser
      if (handled) {
        return false;
      }
    };
  };
}
