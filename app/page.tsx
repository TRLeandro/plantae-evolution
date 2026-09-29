'use client';

/**
 * Plantae Evolution — Bacia Hidrográfica, Mata Ciliar e Estações
 *
 * Layout: coluna única centrada (max-w-5xl) com o canvas como protagonista.
 * Todo o conteúdo secundário (stats, cenários, ajustes, regras) fica num
 * drawer lateral revelado por botão, sem pausar a simulação. Pincéis e legenda
 * ficam perto do mapa, sempre visíveis. Ver DESIGN.md.
 */

import { useState, useCallback } from 'react';
import {
  Cell,
  GridCoord,
  SimulationMetrics,
  BrushTool,
  ClimateSeason,
} from '@/lib/types';
import SimulationCanvas from '@/components/SimulationCanvas';
import SeasonIndicator from '@/components/SeasonIndicator';
import {
  BrushPicker,
  PlaybackControls,
  ScenarioPicker,
  SimulationSettings,
} from '@/components/ControlBar';
import StatsCard from '@/components/StatsCard';
import MapFrame, { InspectedCell } from '@/components/MapFrame';
import LegendStrip from '@/components/LegendStrip';
import SettingsDrawer from '@/components/SettingsDrawer';

export default function Home() {
  // Estados de Execução e Parâmetros da Simulação
  const [running, setRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(12); // Quadros por tick
  const [waterRadius, setWaterRadius] = useState<number>(2);
  const [disperserCount, setDisperserCount] = useState<number>(10);
  const [activeBrush, setActiveBrush] = useState<BrushTool>('plant_tree');
  const [activePresetId, setActivePresetId] = useState<string>('balanced');
  const [stepTrigger, setStepTrigger] = useState<number>(0);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Drawer de configurações
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Métricas em Tempo Real sincronizadas com throttle do Canvas
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalRiverCells: 32,
    activeRiverCells: 32,
    dryRiverCells: 0,
    riverPreservationPct: 100,
    adultTreeCount: 65,
    sproutCount: 0,
    seedCount: 0,
    riparianDensityPct: 100,
    totalSeedsDropped: 0,
    seedsGerminated: 0,
    seedsLost: 0,
    effectiveGerminationRate: 100,
    currentSeason: ClimateSeason.CHUVOSA,
    seasonProgress: 0,
    totalTicks: 0,
  });

  // Inspeção da célula sob o cursor
  const [inspectedCell, setInspectedCell] = useState<InspectedCell | null>(null);

  // Handlers de Ações
  const handleTogglePlay = useCallback(() => {
    setRunning((prev) => !prev);
  }, []);

  const handleStep = useCallback(() => {
    setStepTrigger((prev) => prev + 1);
  }, []);

  const handleReset = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
  }, []);

  const handleSelectPreset = useCallback((presetId: string) => {
    setActivePresetId(presetId);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  const handleWaterRadiusChange = useCallback((newRadius: number) => {
    setWaterRadius(newRadius);
  }, []);

  const handleDisperserCountChange = useCallback((newCount: number) => {
    setDisperserCount(newCount);
  }, []);

  const handleMetricsUpdate = useCallback((newMetrics: SimulationMetrics) => {
    setMetrics(newMetrics);
  }, []);

  const handleCellHover = useCallback(
    (coord: GridCoord | null, cell: Cell | null, neighborTrees: number) => {
      if (!coord || !cell) {
        setInspectedCell(null);
        return;
      }
      setInspectedCell({ coord, cell, neighborTrees });
    },
    [],
  );

  return (
    <>
      {/* Botão fixo na borda direita — sempre visível, abre/fecha o drawer */}
      <button
        type="button"
        onClick={() => setDrawerOpen((prev) => !prev)}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 flex items-center justify-center rounded-l-sm border border-r-0 border-control-border bg-frame px-2 py-4 text-ink hover:bg-sage cursor-pointer active:translate-y-px"
        aria-label={drawerOpen ? 'Fechar configurações' : 'Abrir configurações'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6.86 1.5h2.28l.36 1.8.9.38 1.56-.96 1.62 1.62-.96 1.56.38.9 1.8.36v2.28l-1.8.36-.38.9.96 1.56-1.62 1.62-1.56-.96-.9.38-.36 1.8H6.86l-.36-1.8-.9-.38-1.56.96-1.62-1.62.96-1.56-.38-.9-1.8-.36V6.86l1.8-.36.9-.38-.96-1.56L5.56 3l1.56.96.9-.38z" />
          <circle cx="8" cy="8" r="2" />
        </svg>
      </button>

      {/* Barra fixa no topo — só estação + controles de reprodução */}
      <div className="sticky top-0 z-30 border-b border-line bg-mist">
        <div className="mx-auto max-w-5xl px-4 py-2 sm:px-6 lg:px-8">
          <SeasonIndicator
            compact
            season={metrics.currentSeason}
            progress={metrics.seasonProgress}
            totalTicks={metrics.totalTicks}
            actions={
              <PlaybackControls
                running={running}
                onTogglePlay={handleTogglePlay}
                onStep={handleStep}
                onReset={handleReset}
              />
            }
          />
        </div>
      </div>

      {/* Conteúdo principal — pb-20 no mobile para a toolbar de pincéis não cobrir */}
      <div className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
        <header className="max-w-prose">
          <h1 className="text-2xl font-semibold">Bacia hidrográfica e mata ciliar</h1>
          <p className="mt-2 text-ink-muted">
            Um rio atravessa o mapa, e na estiagem os trechos com poucas árvores por perto secam.
            Use os pincéis para plantar, desmatar ou abrir o rio e veja o que acontece na próxima
            seca.
          </p>
        </header>

        {/* Desktop: grid com sidebar de pincéis à esquerda + mapa à direita */}
        <div className="mt-4 lg:grid lg:grid-cols-[auto_1fr] lg:gap-4 lg:items-start">
          {/* Sidebar esquerda — pincéis (só desktop) */}
          <aside className="hidden lg:sticky lg:top-14 lg:block lg:self-start">
            <BrushPicker variant="sidebar" activeBrush={activeBrush} onSelectBrush={setActiveBrush} />
          </aside>

          <div className="space-y-4">
            <MapFrame inspected={inspectedCell}>
              <SimulationCanvas
                activePresetId={activePresetId}
                activeBrush={activeBrush}
                framesPerTick={speed}
                waterRadius={waterRadius}
                disperserCount={disperserCount}
                running={running}
                stepTrigger={stepTrigger}
                resetTrigger={resetTrigger}
                onMetricsUpdate={handleMetricsUpdate}
                onCellHover={handleCellHover}
                className="w-full"
              />
            </MapFrame>

            <LegendStrip />

            <p className="text-xs text-ink-muted">
              Grade de 32 colunas por 24 linhas. A cada tick, todas as células mudam ao mesmo
              tempo.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar de pincéis fixa no rodapé — só mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-mist px-2 py-2 lg:hidden">
        <BrushPicker variant="toolbar" activeBrush={activeBrush} onSelectBrush={setActiveBrush} />
      </div>

      {/* Drawer de configurações — a simulação continua rodando enquanto está aberto */}
      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <StatsCard metrics={metrics} />

        <ScenarioPicker activePresetId={activePresetId} onSelectPreset={handleSelectPreset} />

        <SimulationSettings
          speed={speed}
          onSpeedChange={handleSpeedChange}
          waterRadius={waterRadius}
          onWaterRadiusChange={handleWaterRadiusChange}
          disperserCount={disperserCount}
          onDisperserCountChange={handleDisperserCountChange}
        />

        <section aria-labelledby="rules-heading">
          <h2 id="rules-heading" className="mb-2 text-base font-semibold">
            Como funciona
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-muted">
            <li>
              Na estiagem, um trecho de rio com menos de 3 árvores adultas nas 8 células em volta
              pode secar a cada tick. Na chuva, trechos secos ao lado de água voltam a encher.
            </li>
            <li>
              Sementes em terra úmida viram broto e depois árvore. Em terra seca, morrem depois de
              15 ticks.
            </li>
          </ul>
        </section>
      </SettingsDrawer>
    </>
  );
}
