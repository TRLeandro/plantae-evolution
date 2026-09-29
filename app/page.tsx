'use client';

import { useState } from 'react';
import SimulationCanvas from '@/components/SimulationCanvas';
import type { Cell, GridCoord } from '@/types/simulation';

interface ClickLog {
  coord: GridCoord;
  cell: Cell;
  timestamp: string;
}

export default function Home() {
  const [lastClick, setLastClick] = useState<ClickLog | null>(null);
  const [clickCount, setClickCount] = useState<number>(0);

  const handleCellClick = (coord: GridCoord, cell: Cell) => {
    const timestamp = new Date().toLocaleTimeString();
    setLastClick({ coord, cell, timestamp });
    setClickCount((prev) => prev + 1);
    console.log(
      `[Plantae Evolution] Clique registrado -> Linha: ${coord.row}, Coluna: ${coord.col} (Estado: ${cell.estado})`,
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-3 sm:p-6 md:p-8 gap-4 sm:gap-6 bg-background text-foreground max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="text-center space-y-1 px-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <span>Plantae Evolution</span>
          <span className="text-lg sm:text-xl">🌱</span>
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-xs sm:max-w-md mx-auto">
          Canvas interativo do autômato celular com detecção de toque e clique
        </p>
      </header>

      {/* Canvas Central */}
      <div className="w-full max-w-[640px] flex flex-col items-center gap-3 px-1 sm:px-0">
        <SimulationCanvas onCellClick={handleCellClick} />

        {/* Painel de Coordenadas e Registro de Clique */}
        <div className="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-surface-card border border-border-subtle text-xs sm:text-sm shadow-sm transition-all">
          {lastClick ? (
            <div className="w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 font-medium text-border-active shrink-0">
                <span className="w-2 h-2 rounded-full bg-border-active animate-ping" />
                Clique #{clickCount}
              </span>
              <span className="text-foreground">
                Linha: <strong className="text-border-active">{lastClick.coord.row}</strong>,{' '}
                Coluna: <strong className="text-border-active">{lastClick.coord.col}</strong>
              </span>
              <span className="text-text-muted text-[11px] sm:text-xs">
                (Estado: <code className="bg-surface-panel px-1.5 py-0.5 rounded text-text-muted">{lastClick.cell.estado}</code>)
              </span>
            </div>
          ) : (
            <span className="text-text-muted italic text-center sm:text-left text-xs sm:text-sm">
              Toque ou clique em qualquer célula para registrar coordenadas
            </span>
          )}

          {lastClick && (
            <span className="text-[11px] sm:text-xs text-text-muted font-mono shrink-0">
              {lastClick.timestamp}
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
