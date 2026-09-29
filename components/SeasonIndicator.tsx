'use client';

/**
 * SeasonIndicator — estação atual, quanto dela já passou e o que ela
 * muda no rio. Em modo `compact` (barra fixa no topo), fica tudo numa
 * linha só, sem a descrição.
 */

import type { ReactNode } from 'react';
import { ClimateSeason } from '@/lib/types';

interface SeasonIndicatorProps {
  season: ClimateSeason;
  progress: number; // 0 a 100
  totalTicks: number;
  /** Controles exibidos à direita do nome da estação */
  actions?: ReactNode;
  /** Em modo compacto, esconde a descrição e mostra tudo numa linha */
  compact?: boolean;
}

export default function SeasonIndicator({
  season,
  progress,
  totalTicks,
  actions,
  compact = false,
}: SeasonIndicatorProps) {
  const isRain = season === ClimateSeason.CHUVOSA;
  const colorClass = isRain ? 'text-water-text' : 'text-soil-text';
  const barColor = isRain ? 'bg-map-water' : 'bg-map-wet-soil';
  const label = isRain ? 'Estação chuvosa' : 'Estiagem';

  if (compact) {
    return (
      <section aria-labelledby="season-heading" className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2
          id="season-heading"
          className={`text-sm font-semibold shrink-0 ${colorClass}`}
        >
          {label}
        </h2>
        <div
          role="progressbar"
          aria-label="Quanto da estação já passou"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 min-w-16 flex-1 bg-line"
        >
          <div
            className={`h-full transition-[width] duration-300 ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-ink-muted tabular-nums">
          {progress}% · tick {totalTicks}
        </span>
        {actions}
      </section>
    );
  }

  return (
    <section aria-labelledby="season-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="season-heading"
          className={`text-xl font-semibold ${colorClass}`}
        >
          {label}
        </h2>
        {actions}
      </div>

      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        {isRain
          ? 'Com chuva, o rio não evapora, e trechos secos ao lado da água voltam a encher.'
          : 'Na seca, trechos do rio com menos de 3 árvores por perto podem evaporar. Onde a mata ciliar está de pé, a água fica.'}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Quanto da estação já passou"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 flex-1 bg-line"
        >
          <div
            className={`h-full transition-[width] duration-300 ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-ink-muted tabular-nums">
          {progress}% da estação, tick {totalTicks}
        </span>
      </div>
    </section>
  );
}
