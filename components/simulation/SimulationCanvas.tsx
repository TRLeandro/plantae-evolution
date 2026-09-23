'use client';

import { useRef, useEffect, useState } from 'react';
import type p5Type from 'p5';
import type { Cell, CellState, GridCoord, GridDimensions } from '@/types/simulation';
import { PALETTE, hexToRgb } from '@/lib/colors';

// ---------------------------------------------------------------------------
// Constantes do Grid
// ---------------------------------------------------------------------------

const CELL_SIZE = 20;
const GRID_COLS = 32;
const GRID_ROWS = 24;

/** Cores pré-convertidas para RGB (evita parse por frame) */
const COLOR = {
  empty: hexToRgb(PALETTE.grid.empty),
  lines: hexToRgb(PALETTE.grid.lines),
  hover: hexToRgb(PALETTE.grid.hover),
  seed: hexToRgb(PALETTE.stages.seed),
  sprout: hexToRgb(PALETTE.stages.sprout),
  mature: hexToRgb(PALETTE.stages.mature),
  bloom: hexToRgb(PALETTE.stages.bloom),
} as const;

/** Mapa de estado → cor RGB */
const STATE_COLOR: Record<CellState, readonly [number, number, number]> = {
  empty: COLOR.empty,
  seed: COLOR.seed,
  sprout: COLOR.sprout,
  mature: COLOR.mature,
  bloom: COLOR.bloom,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cria uma grade vazia de células */
function createEmptyGrid(cols: number, rows: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({
      estado: 'empty',
      tipoPlanta: undefined,
      idade: 0,
    }))
  );
}

/** Converte posição do mouse em coordenada de célula (ou null se fora) */
function mouseToGridCoord(
  mouseX: number,
  mouseY: number,
  dims: GridDimensions,
): GridCoord | null {
  const col = Math.floor(mouseX / dims.cellSize);
  const row = Math.floor(mouseY / dims.cellSize);
  if (col < 0 || col >= dims.cols || row < 0 || row >= dims.rows) return null;
  return { col, row };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SimulationCanvasProps {
  /** Callback disparado ao clicar em uma célula */
  onCellClick?: (coord: GridCoord, cell: Cell) => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function SimulationCanvas({ onCellClick }: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Inicializando canvas…');

  // Ref estável para o callback — evita re-criação do sketch a cada render
  const onCellClickRef = useRef(onCellClick);
  useEffect(() => {
    onCellClickRef.current = onCellClick;
  }, [onCellClick]);

  // Efeito principal: monta a instância p5
  useEffect(() => {
    if (!containerRef.current) return;

    let p5Instance: p5Type | null = null;
    let isCancelled = false;

    const dims: GridDimensions = {
      cols: GRID_COLS,
      rows: GRID_ROWS,
      cellSize: CELL_SIZE,
    };

    // Estado interno da simulação (fora do React)
    const grid: Cell[][] = createEmptyGrid(dims.cols, dims.rows);
    let hoverCoord: GridCoord | null = null;

    async function init() {
      // Import dinâmico — roda apenas no browser
      const p5Module = (await import('p5')).default;

      // Guarda contra desmontagem durante o await
      if (isCancelled) return;

      const sketch = (p: p5Type) => {
        p.setup = () => {
          const canvas = p.createCanvas(
            dims.cols * dims.cellSize,
            dims.rows * dims.cellSize,
          );
          canvas.style('display', 'block');
          p.frameRate(60);
          setStatus('Clique em uma célula para plantar');
        };

        p.draw = () => {
          // --- Desenho das células ---
          for (let row = 0; row < dims.rows; row++) {
            for (let col = 0; col < dims.cols; col++) {
              const cell = grid[row][col];
              const rgb = STATE_COLOR[cell.estado];

              // Hover highlight
              const isHover =
                hoverCoord !== null &&
                hoverCoord.col === col &&
                hoverCoord.row === row;

              if (isHover && cell.estado === 'empty') {
                p.fill(...COLOR.hover);
              } else {
                p.fill(...rgb);
              }

              p.stroke(...COLOR.lines);
              p.strokeWeight(1);
              p.rect(
                col * dims.cellSize,
                row * dims.cellSize,
                dims.cellSize,
                dims.cellSize,
              );
            }
          }
        };

        p.mouseMoved = () => {
          hoverCoord = mouseToGridCoord(p.mouseX, p.mouseY, dims);
        };

        p.mousePressed = () => {
          const coord = mouseToGridCoord(p.mouseX, p.mouseY, dims);
          if (!coord) return;

          const cell = grid[coord.row][coord.col];

          // Plantio simples para validação: célula vazia → semente
          if (cell.estado === 'empty') {
            cell.estado = 'seed';
            cell.idade = 0;
          }

          // Propaga evento para o React (throttled pelo caller se necessário)
          onCellClickRef.current?.(coord, { ...cell });
        };
      };

      // Instanciação em modo instância, ancorada no container ref
      p5Instance = new p5Module(sketch, containerRef.current!);
    }

    init();

    // Cleanup: desmontagem segura
    return () => {
      isCancelled = true;
      if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
      }
    };
  }, []); // Dependência vazia — monta uma única vez

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="rounded-lg border border-border-subtle overflow-hidden"
        style={{
          width: GRID_COLS * CELL_SIZE,
          height: GRID_ROWS * CELL_SIZE,
        }}
      />
      <span className="text-sm text-text-muted">{status}</span>
    </div>
  );
}
