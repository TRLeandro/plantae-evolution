'use client';

/**
 * MapSymbol — a mesma ilustração que o SimulationCanvas desenha em cada
 * célula, para legenda, pincéis e barra de inspeção. Usa as funções de
 * components/cellArt.ts, então fica idêntico ao mapa por construção.
 *
 * O nível de detalhe segue a mesma regra do canvas: abaixo de
 * DETAIL_THRESHOLD_PX, desenho simplificado.
 */

import { useEffect, useRef } from 'react';
import { CellState } from '@/lib/types';
import { CELL_COLORS, UI_COLORS } from '@/lib/constants';
import { DETAIL_THRESHOLD_PX, drawCellArt, drawPollinator } from '@/components/cellArt';

export type MapSymbolKind = CellState | 'pollinator' | 'deforest' | 'none';

const SEED_COLOR = '#E6C27A';

export default function MapSymbol({
  kind,
  size = 20,
  className,
}: {
  kind: MapSymbolKind;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || kind === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform((size * dpr) / 20, 0, 0, (size * dpr) / 20, 0, 0);
    ctx.clearRect(0, 0, 20, 20);
    const detail = size >= DETAIL_THRESHOLD_PX ? 'full' : 'simple';

    if (kind === 'pollinator') {
      ctx.fillStyle = UI_COLORS.surfaceCard;
      ctx.fillRect(0, 0, 20, 20);
      drawPollinator(ctx, 11, 10, 1, 0, false, 0, 0, detail);
      return;
    }

    const state = kind === 'deforest' ? CellState.ARVORE_ADULTA : kind;
    ctx.fillStyle = CELL_COLORS[state];
    ctx.fillRect(0, 0, 20, 20);
    drawCellArt(ctx, state, 0, detail);

    if (kind === 'deforest') {
      // Árvore riscada: o que o pincel remove
      ctx.strokeStyle = SEED_COLOR;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(3, 17);
      ctx.lineTo(17, 3);
      ctx.stroke();
    }
  }, [kind, size]);

  if (kind === 'none') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={`shrink-0 ${className ?? ''}`}>
        <rect x="2.5" y="2.5" width="15" height="15" fill="none" stroke="currentColor" strokeDasharray="3 2" />
      </svg>
    );
  }

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`shrink-0 outline outline-1 -outline-offset-1 outline-current/45 ${className ?? ''}`}
    />
  );
}
