'use client';

/**
 * MapFrame — a "folha" do mapa, como numa carta impressa:
 * moldura em tinta, marcas de coluna (topo) e linha (esquerda) na margem,
 * barra de escala e barra de inspeção. A legenda ficou em LegendStrip.tsx.
 *
 * As marcas usam a mesma numeração da barra de inspeção (a partir de 1).
 */

import type { ReactNode } from 'react';
import { Cell, CellState, GridCoord } from '@/lib/types';
import { GRID_COLS, GRID_ROWS } from '@/lib/constants';
import MapSymbol from '@/components/MapSymbol';

export const CELL_LABEL: Record<CellState, string> = {
  [CellState.LEITO_AGUA]: 'Rio com água',
  [CellState.LEITO_SECO]: 'Rio seco',
  [CellState.SOLO_FERTIL]: 'Terra úmida',
  [CellState.SOLO_SECO]: 'Terra seca',
  [CellState.SEMENTE]: 'Semente',
  [CellState.BROTO]: 'Broto',
  [CellState.ARVORE_ADULTA]: 'Árvore adulta',
};

// A legenda foi extraída para components/LegendStrip.tsx

// Marcas na margem só nas posições numeradas: a primeira e as múltiplas de 5
const isLabeled = (n: number) => n === 1 || n % 5 === 0;
const SCALE_CELLS = 5;

export interface InspectedCell {
  coord: GridCoord;
  cell: Cell;
  neighborTrees: number;
}

export default function MapFrame({
  children,
  inspected,
}: {
  children: ReactNode;
  inspected: InspectedCell | null;
}) {
  const isWater = inspected?.cell.state === CellState.LEITO_AGUA;
  const isProtected = (inspected?.neighborTrees ?? 0) >= 3;

  return (
    // No mobile a moldura encosta nas bordas da tela para o mapa ganhar largura
    <figure className="-mx-4 border-y-2 border-ink bg-frame px-2 py-3 sm:mx-0 sm:border-x-2 sm:p-4">
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] font-condensed text-xs text-ink-muted tabular-nums">
        {/* Canto vazio */}
        <div />

        {/* Marcas das colunas */}
        <div className="grid grid-cols-[repeat(32,minmax(0,1fr))] items-end" aria-hidden="true">
          {Array.from({ length: GRID_COLS }, (_, i) => i + 1).map((n) => (
            <div key={n} className="flex flex-col items-center">
              {isLabeled(n) && (
                <>
                  <span className="leading-none">{n}</span>
                  <span className="mt-1 h-2 w-px bg-ink" />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Marcas das linhas */}
        <div className="grid grid-rows-[repeat(24,minmax(0,1fr))]" aria-hidden="true">
          {Array.from({ length: GRID_ROWS }, (_, i) => i + 1).map((n) => (
            <div key={n} className="relative flex items-center justify-end">
              {/* Número fora do fluxo: no mobile a linha tem menos de 13px de altura */}
              {isLabeled(n) && (
                <>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 leading-none">{n}</span>
                  <span className="h-px w-2 bg-ink" />
                </>
              )}
            </div>
          ))}
        </div>

        {/* O mapa */}
        <div className="outline outline-1 outline-ink">{children}</div>

        {/* Escala: largura exata de 5 células */}
        <div />
        <div className="mt-3 flex items-center gap-2" aria-hidden="true">
          <span
            className="h-2 border-x border-b border-ink"
            style={{ width: `${(SCALE_CELLS / GRID_COLS) * 100}%` }}
          />
          <span>{SCALE_CELLS} células</span>
        </div>
      </div>

      {/* Inspeção */}
      <p className="mt-3 flex min-h-10 flex-wrap items-center gap-x-2 border-t border-line px-2 pt-3 text-sm sm:px-0">
        {inspected ? (
          <>
            <MapSymbol kind={inspected.cell.state} size={16} className="text-ink" />
            <span className="tabular-nums text-ink-muted">
              Linha {inspected.coord.row + 1}, coluna {inspected.coord.col + 1}:
            </span>
            <span>
              <span className="font-medium">{CELL_LABEL[inspected.cell.state] ?? 'Desconhecido'}</span>
              <span className="tabular-nums text-ink-muted">
                , há {inspected.cell.age} {inspected.cell.age === 1 ? 'tick' : 'ticks'}.
              </span>
            </span>
            {isWater && (
              <span className={isProtected ? 'text-tree-text' : 'text-rust-text'}>
                {isProtected
                  ? `Protegido: ${inspected.neighborTrees} árvores por perto.`
                  : `Pode secar: ${inspected.neighborTrees} de 3 árvores por perto.`}
              </span>
            )}
          </>
        ) : (
          <span className="text-ink-muted">Passe o mouse no mapa para ver cada célula.</span>
        )}
      </p>

    </figure>
  );
}
