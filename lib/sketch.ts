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
  getCell,
  updateCell,
  isCellEmpty,
} from '@/lib/grid';
import { createTickState, advanceFrame, setSpeed } from '@/lib/tick';
import { advanceGrid } from '@/lib/lifecycle';
import {
  createWindAgents,
  advanceWindAgent,
  DEFAULT_WIND_AGENT_COUNT,
} from '@/lib/wind';
import type {
  Cell,
  CellState,
  Grid,
  GridCoord,
  TickState,
  WindAgent,
} from '@/types/simulation';

export { CANVAS_WIDTH, CANVAS_HEIGHT };

// Cores pré-computadas (evita hexToRgb repetitivo a cada frame no draw)
const BG_RGB = hexToRgb(PALETTE.ui.background);
const LINES_RGB = hexToRgb(PALETTE.grid.lines);
const HOVER_RGB = hexToRgb(PALETTE.grid.hover);
const WIND_RGB = hexToRgb(PALETTE.agents.wind.color);

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
  /** Quantidade estática de frames p5 entre cada tick lógico (padrão: 15) */
  framesPerTick?: number;
  /** Provedor dinâmico de cadência de frames por tick (para sliders sem recriar o sketch) */
  getFramesPerTick?: () => number;
  /** Callback opcional disparado em cada tick lógico */
  onTick?: (totalTicks: number) => void;
  /** Quantidade de agentes Vento instanciados na simulação (padrão: 3) */
  windAgentCount?: number;
}

/**
 * Cria a função sketch no formato de instância do p5 (`new p5(sketch, container)`).
 * Recebe opções como callbacks para comunicar eventos com a camada React de forma desacoplada.
 */
export function createSketch(options?: SketchOptions) {
  return (p: p5) => {
    // Matriz de células interna do motor de simulação (fora do ciclo de render do React)
    const grid: Grid = createGrid();
    let hoverCoord: GridCoord | null = null;

    // Agentes de dispersão atmosférica (Vento)
    const windCount = options?.windAgentCount ?? DEFAULT_WIND_AGENT_COUNT;
    const windAgents: WindAgent[] = createWindAgents(
      windCount,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );
    let localFrameCount = 0;

    // Estado do motor de ticks desacoplado da taxa de quadros visual (p5 draw)
    const initialFrames = options?.getFramesPerTick?.() ?? options?.framesPerTick;
    const tickState: TickState = createTickState(initialFrames);

    // ----- setup -----
    p.setup = () => {
      const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
      canvas.style('display', 'block');
      p.frameRate(60);
    };

    // ----- draw -----
    p.draw = () => {
      // 0. Sincronização dinâmica de velocidade sem reinicializar o sketch
      if (options?.getFramesPerTick) {
        const dynamicSpeed = options.getFramesPerTick();
        if (dynamicSpeed && dynamicSpeed !== tickState.framesPerTick) {
          setSpeed(tickState, dynamicSpeed);
        }
      }

      // 1. Processamento do tick lógico (desacoplado dos 60 FPS do p5)
      const shouldTick = advanceFrame(tickState);
      if (shouldTick) {
        advanceGrid(grid);
        options?.onTick?.(tickState.totalTicks);
      }

      // 2. Movimentação contínua dos agentes Vento (deslocamento fluido a cada frame)
      if (tickState.running) {
        localFrameCount++;
        for (const agent of windAgents) {
          advanceWindAgent(agent, localFrameCount, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
      }

      // 3. Renderização gráfica (executa a cada frame visual)
      p.background(...BG_RGB);

      // Preenchimento de cada célula
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

      // Linhas da grade por cima
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

      // 4. Renderização visual dos agentes Vento sobre o grid (efeito partículas etéreas com cauda)
      p.noStroke();
      for (const agent of windAgents) {
        const speed = Math.hypot(agent.vx, agent.vy) || 1;
        const dirX = agent.vx / speed;
        const dirY = agent.vy / speed;

        // Halo suave difuso
        p.fill(WIND_RGB[0], WIND_RGB[1], WIND_RGB[2], 40);
        p.ellipse(agent.x, agent.y, 14, 14);

        // Partícula principal do vento
        p.fill(WIND_RGB[0], WIND_RGB[1], WIND_RGB[2], 210);
        p.ellipse(agent.x, agent.y, 7, 7);

        // Rastro secundário (trail 1)
        p.fill(WIND_RGB[0], WIND_RGB[1], WIND_RGB[2], 130);
        p.ellipse(agent.x - dirX * 6, agent.y - dirY * 6, 4.5, 4.5);

        // Rastro terciário (trail 2)
        p.fill(WIND_RGB[0], WIND_RGB[1], WIND_RGB[2], 65);
        p.ellipse(agent.x - dirX * 12, agent.y - dirY * 12, 2.5, 2.5);
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
      const cell = getCell(grid, coord);
      if (!cell) return false;

      // Plantio inicial do MVP (Sprint 1): célula vazia → semente (briófita)
      if (isCellEmpty(cell)) {
        updateCell(grid, coord, { estado: 'seed', tipoPlanta: 'bryophyte', idade: 0 });
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
