/**
 * Plantae Evolution — Sketch p5.js (Modo Instância)
 *
 * Desenha a matriz/grid celular do autômato na área central.
 * Utiliza tokens de cor de `lib/colors.ts` e dimensões de `lib/grid.ts`.
 *
 * ⚠️ Este módulo executa APENAS no cliente (importado via useEffect).
 */

import type p5 from 'p5';
import { PALETTE, hexToRgb } from '@/lib/colors';
import { CELL_SIZE, GRID_COLS, GRID_ROWS } from '@/lib/grid';

// Cores pré-computadas (evita conversão a cada frame)
const EMPTY_RGB = hexToRgb(PALETTE.grid.empty);
const LINES_RGB = hexToRgb(PALETTE.grid.lines);
const BG_RGB = hexToRgb(PALETTE.ui.background);
const HOVER_RGB = hexToRgb(PALETTE.grid.hover);

/** Largura total do canvas em pixels. */
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
/** Altura total do canvas em pixels. */
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

/**
 * Retorna a função sketch no formato instância de p5
 * (`new p5(sketch, container)`).
 */
export function createSketch() {
  return (p: p5) => {
    // ----- setup -----
    p.setup = () => {
      p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
      p.noLoop(); // Redesenha apenas sob demanda (Sprint 0)
      drawGrid(p);
    };

    // ----- draw -----
    p.draw = () => {
      drawGrid(p);
    };

    // ----- mouseMoved — destaque de hover -----
    p.mouseMoved = () => {
      p.redraw();
    };
  };
}

// ---------------------------------------------------------------------------
// Funções internas de renderização
// ---------------------------------------------------------------------------

/** Desenha o grid completo: fundo, células e linhas da grade. */
function drawGrid(p: p5): void {
  // Fundo escuro
  p.background(...BG_RGB);

  // Coordenadas da célula sob o cursor (pode ser -1 se fora)
  const hoverCol = Math.floor(p.mouseX / CELL_SIZE);
  const hoverRow = Math.floor(p.mouseY / CELL_SIZE);
  const isHoverValid =
    hoverCol >= 0 &&
    hoverCol < GRID_COLS &&
    hoverRow >= 0 &&
    hoverRow < GRID_ROWS &&
    p.mouseX >= 0 &&
    p.mouseX < CANVAS_WIDTH &&
    p.mouseY >= 0 &&
    p.mouseY < CANVAS_HEIGHT;

  // Desenha células preenchidas
  p.noStroke();
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const isHover = isHoverValid && col === hoverCol && row === hoverRow;
      const rgb = isHover ? HOVER_RGB : EMPTY_RGB;
      p.fill(...rgb);
      p.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  // Desenha linhas da grade por cima
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
}
