'use client';

/**
 * SimulationCanvas — Renderizador Canvas 2D de Alto Desempenho
 *
 * Executa o loop gráfico desacoplado via requestAnimationFrame com:
 * 1. Renderização a ~60 FPS via Canvas 2D com a paleta canônica do TASK.md.
 * 2. Ilustração por célula (camada offscreen, só redesenha o que muda) e polinizadores — components/cellArt.ts.
 * 3. Suporte completo a mouse e toque (clique e arrasto contínuo com pincéis).
 * 4. Sincronização throttled de métricas com a árvore React.
 *
 * Referência: TASK.md § Fase 3 (SimulationCanvas.tsx)
 */

import { useEffect, useRef, useCallback } from 'react';
import { SimulationEngine, countNeighboringAdultTrees } from '@/lib/engine';
import {
  Cell,
  GridCoord,
  SimulationMetrics,
  BrushTool,
} from '@/lib/types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  UI_COLORS,
} from '@/lib/constants';
import {
  DETAIL_THRESHOLD_PX,
  Detail,
  drawPollinator,
  updateCellLayer,
} from '@/components/cellArt';
import { mouseToGridCoord, isCoordValid } from '@/lib/utils';
import { PRESETS } from '@/lib/presets';

// Cores da grade e do destaque sob o cursor (a ilustração das células fica em cellArt.ts)
const MAP_SYMBOL = {
  gridLine: 'rgba(23, 38, 31, 0.12)',
  hoverFill: 'rgba(243, 246, 239, 0.5)', // clareia a célula sob o cursor
};

export interface SimulationCanvasProps {
  activePresetId: string;
  activeBrush: BrushTool;
  framesPerTick: number;
  waterRadius: number;
  disperserCount?: number;
  running: boolean;
  stepTrigger: number;
  resetTrigger: number;
  onMetricsUpdate?: (metrics: SimulationMetrics) => void;
  onCellHover?: (coord: GridCoord | null, cell: Cell | null, neighborTrees: number) => void;
  className?: string;
}

export default function SimulationCanvas({
  activePresetId,
  activeBrush,
  framesPerTick,
  waterRadius,
  disperserCount,
  running,
  stepTrigger,
  resetTrigger,
  onMetricsUpdate,
  onCellHover,
  className,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Instância do motor mantida internamente na ref do Canvas
  const engineRef = useRef<SimulationEngine | null>(null);

  // Inicializa engine na montagem ou via ref
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      const preset = PRESETS[activePresetId] ?? PRESETS.balanced;
      engineRef.current = new SimulationEngine(preset.createGrid(), {
        waterRadius,
        framesPerTick,
        disperserCount: disperserCount !== undefined ? disperserCount : undefined,
      });
      engineRef.current.season = preset.initialSeason;
    }
    return engineRef.current;
  }, [activePresetId, waterRadius, framesPerTick, disperserCount]);

  // Referências sincronizadas para o loop de requestAnimationFrame
  const activeBrushRef = useRef(activeBrush);
  const framesPerTickRef = useRef(framesPerTick);
  const runningRef = useRef(running);
  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  const onCellHoverRef = useRef(onCellHover);

  // Estado de interação do cursor
  const isMouseDownRef = useRef(false);
  const hoverCoordRef = useRef<GridCoord | null>(null);

  useEffect(() => {
    activeBrushRef.current = activeBrush;
  }, [activeBrush]);

  useEffect(() => {
    framesPerTickRef.current = framesPerTick;
    const eng = engineRef.current;
    if (eng) {
      eng.setSpeed(framesPerTick);
    }
  }, [framesPerTick]);

  useEffect(() => {
    const eng = engineRef.current;
    if (eng) {
      eng.setWaterRadius(waterRadius);
      onMetricsUpdateRef.current?.(eng.getMetrics());
    }
  }, [waterRadius]);

  useEffect(() => {
    if (disperserCount !== undefined) {
      const eng = engineRef.current;
      if (eng) {
        eng.setDisperserCount(disperserCount);
        onMetricsUpdateRef.current?.(eng.getMetrics());
      }
    }
  }, [disperserCount]);

  useEffect(() => {
    runningRef.current = running;
    const eng = engineRef.current;
    if (eng) {
      eng.running = running;
    }
  }, [running]);

  useEffect(() => {
    onMetricsUpdateRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  useEffect(() => {
    onCellHoverRef.current = onCellHover;
  }, [onCellHover]);

  // Carrega Preset quando activePresetId ou resetTrigger mudar
  useEffect(() => {
    const eng = getEngine();
    const preset = PRESETS[activePresetId] ?? PRESETS.balanced;
    eng.loadGrid(preset.createGrid(), preset.initialSeason);
    if (disperserCount !== undefined) {
      eng.setDisperserCount(disperserCount);
    }
    onMetricsUpdateRef.current?.(eng.getMetrics());
  }, [activePresetId, resetTrigger, getEngine, disperserCount]);

  // Avançar 1 tick manualmente
  useEffect(() => {
    if (stepTrigger === 0) return;
    const eng = engineRef.current;
    if (eng) {
      eng.step();
      onMetricsUpdateRef.current?.(eng.getMetrics());
    }
  }, [stepTrigger]);

  // Aplica ferramenta de pincel sob o ponto de toque/clique
  const applyBrushAtPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const eng = engineRef.current;
    if (!canvas || !eng) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const coord = mouseToGridCoord(canvasX, canvasY, GRID_COLS, GRID_ROWS, CELL_SIZE);
    if (!coord) return;

    eng.applyBrush(coord, activeBrushRef.current);

    const cell = eng.grid[coord.row]?.[coord.col] ?? null;
    const neighborTrees = countNeighboringAdultTrees(eng.grid, coord);
    onCellHoverRef.current?.(coord, cell, neighborTrees);
  }, []);

  // Loop Principal de Renderização e Animação (requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let frameAccumulator = 0;
    let visualFrameCount = 0;
    let lastMetricsSync = 0;

    const render = () => {
      visualFrameCount++;
      const eng = engineRef.current;
      if (!eng) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const isRunning = runningRef.current;
      const targetFramesPerTick = framesPerTickRef.current || 12;

      // 1. Avanço de ticks lógicos da simulação
      if (isRunning) {
        frameAccumulator++;
        if (frameAccumulator >= targetFramesPerTick) {
          eng.step();
          frameAccumulator = 0;
        }

        // Movimentação fluida contínua dos dispersores a 60 FPS
        eng.updateDispersersMotion();
      }

      // Sincronização throttled de métricas com o React (~4x por segundo)
      if (visualFrameCount - lastMetricsSync >= 15) {
        lastMetricsSync = visualFrameCount;
        onMetricsUpdateRef.current?.(eng.getMetrics());
      }

      // 2. Renderização Gráfica do Grid Celular
      ctx.fillStyle = UI_COLORS.background;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const rows = eng.grid.length;
      const cols = eng.grid[0]?.length ?? 0;

      // Abaixo de DETAIL_THRESHOLD_PX por célula na tela, desenho simplificado
      const detail: Detail =
        canvas.clientWidth / (cols || 1) >= DETAIL_THRESHOLD_PX ? 'full' : 'simple';

      // Células: fundo chapado + ilustração (components/cellArt.ts). A camada
      // offscreen só redesenha as células que mudaram de estado.
      ctx.drawImage(updateCellLayer(canvas, eng.grid, detail), 0, 0);

      // Linhas da grade
      ctx.strokeStyle = MAP_SYMBOL.gridLine;
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, r * CELL_SIZE);
        ctx.stroke();
      }

      // 3. Polinizadores: corpo, asas e rastro (components/cellArt.ts)
      for (const d of eng.dispersers) {
        drawPollinator(ctx, d.x, d.y, d.vx, d.vy, d.hasSeed, visualFrameCount, d.id, detail);
      }

      // 4. Destaque de Célula sob o Cursor
      const hover = hoverCoordRef.current;
      if (hover && isCoordValid(hover, cols, rows)) {
        const hx = hover.col * CELL_SIZE;
        const hy = hover.row * CELL_SIZE;

        ctx.strokeStyle = UI_COLORS.textPrimary;
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        ctx.fillStyle = MAP_SYMBOL.hoverFill;
        ctx.fillRect(hx, hy, CELL_SIZE, CELL_SIZE);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [getEngine]);

  // Handlers de Mouse e Toque
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    applyBrushAtPoint(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const eng = engineRef.current;
    if (!canvas || !eng) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const coord = mouseToGridCoord(canvasX, canvasY, GRID_COLS, GRID_ROWS, CELL_SIZE);
    hoverCoordRef.current = coord;

    if (coord) {
      const cell = eng.grid[coord.row]?.[coord.col] ?? null;
      const neighborTrees = countNeighboringAdultTrees(eng.grid, coord);
      onCellHoverRef.current?.(coord, cell, neighborTrees);
    } else {
      onCellHoverRef.current?.(null, null, 0);
    }

    if (isMouseDownRef.current) {
      applyBrushAtPoint(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseLeave = () => {
    isMouseDownRef.current = false;
    hoverCoordRef.current = null;
    onCellHoverRef.current?.(null, null, 0);
  };

  // Suporte Touch para Dispositivos Móveis
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      isMouseDownRef.current = true;
      applyBrushAtPoint(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0 && isMouseDownRef.current) {
      const touch = e.touches[0];
      applyBrushAtPoint(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    isMouseDownRef.current = false;
    hoverCoordRef.current = null;
    onCellHoverRef.current?.(null, null, 0);
  };

  return (
    <div className={`relative w-full aspect-[4/3] overflow-hidden bg-frame touch-none select-none flex items-center justify-center ${className ?? ''}`}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
}
