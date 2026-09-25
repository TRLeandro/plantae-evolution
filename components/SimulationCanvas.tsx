'use client';

/**
 * SimulationCanvas — Componente React que hospeda o canvas p5.js.
 *
 * Carrega o p5.js via dynamic import no useEffect para evitar falhas
 * de SSR/hidratação (p5 depende de `window` e `document`).
 *
 * Conecta o motor gráfico desacoplado (lib/sketch.ts) com a árvore React
 * via callback onCellClick mantido em ref estável.
 */

import { useEffect, useRef } from 'react';
import type p5 from 'p5';
import type { Cell, GridCoord, PlantType } from '@/types/simulation';

export interface SimulationCanvasProps {
  /** Callback disparado ao clicar em uma célula do grid */
  onCellClick?: (coord: GridCoord, cell: Cell) => void;
  /** Espécie vegetal atualmente ativa para plantio manual */
  activeSpecies?: PlantType;
  /** Quantidade de frames p5 entre cada tick lógico (padrão: 15) */
  framesPerTick?: number;
  /** Quantidade de agentes Vento instanciados na simulação (padrão: 3) */
  windAgentCount?: number;
  className?: string;
}

export default function SimulationCanvas({
  onCellClick,
  activeSpecies = 'bryophyte',
  framesPerTick,
  windAgentCount,
  className,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCellClickRef = useRef(onCellClick);
  const activeSpeciesRef = useRef(activeSpecies);
  const framesPerTickRef = useRef(framesPerTick);

  useEffect(() => {
    onCellClickRef.current = onCellClick;
  }, [onCellClick]);

  useEffect(() => {
    activeSpeciesRef.current = activeSpecies;
  }, [activeSpecies]);

  useEffect(() => {
    framesPerTickRef.current = framesPerTick;
  }, [framesPerTick]);

  useEffect(() => {
    let cancelled = false;
    let p5Instance: p5 | null = null;

    async function init() {
      // Dynamic imports — apenas no browser
      const [{ default: P5 }, { createSketch }] = await Promise.all([
        import('p5'),
        import('@/lib/sketch'),
      ]);

      if (cancelled || !containerRef.current) return;

      // Cria a instância do p5 dentro do elemento container
      p5Instance = new P5(
        createSketch({
          onCellClick: (coord, cell) => {
            onCellClickRef.current?.(coord, cell);
          },
          getFramesPerTick: () => framesPerTickRef.current ?? 15,
          getActiveSpecies: () => activeSpeciesRef.current,
          windAgentCount,
        }),
        containerRef.current,
      );
    }

    init();

    return () => {
      cancelled = true;
      if (p5Instance) {
        p5Instance.remove();
        p5Instance = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[640px] aspect-[4/3] rounded-lg border border-border-subtle overflow-hidden bg-grid-empty shadow-lg relative flex items-center justify-center touch-none select-none [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:block ${className ?? ''}`}
    />
  );
}
