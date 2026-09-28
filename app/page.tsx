'use client';

/**
 * Plantae Evolution — Bacia Hidrográfica, Mata Ciliar e Estações
 *
 * Layout: contêiner centralizado de até 1400px com duas áreas de cor que
 * se encostam (névoa até 48rem, sálvia com o resto):
 * - névoa: título, estação + reprodução, pincéis e a moldura do mapa
 *   (com marcas de linha/coluna, escala, inspeção e legenda);
 * - sálvia: números da bacia, cenário, ajustes e regras.
 * No mobile as duas empilham nessa ordem. Ver DESIGN.md.
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
    // Fundo: a névoa vem do body; a sálvia se estende até a borda direita da
    // janela pelo ::after do <aside>. O conteúdo fica sempre no contêiner
    // centralizado de 1400px.
    <div className="overflow-x-clip">
      <div className="mx-auto min-h-screen max-w-[1400px] lg:grid lg:grid-cols-[minmax(0,48rem)_minmax(22rem,1fr)]">
        {/* Área do mapa (névoa) */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[44rem] space-y-4">
            <header className="max-w-prose pb-2">
              <h1 className="text-2xl font-semibold">Bacia hidrográfica e mata ciliar</h1>
              <p className="mt-2 text-ink-muted">
                Um rio atravessa o mapa, e na estiagem os trechos com poucas árvores por perto secam.
                Use os pincéis para plantar, desmatar ou abrir o rio e veja o que acontece na próxima
                seca.
              </p>
            </header>

            <SeasonIndicator
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

            <BrushPicker activeBrush={activeBrush} onSelectBrush={setActiveBrush} />

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

            <p className="text-xs text-ink-muted">
              Grade de 32 colunas por 24 linhas. A cada tick, todas as células mudam ao mesmo
              tempo.
            </p>
          </div>
        </main>

        {/* Área de apoio (sálvia) */}
        <aside className="relative border-t border-line bg-sage px-4 py-6 sm:px-6 lg:border-t-0 lg:border-l lg:px-8 lg:py-8 lg:after:absolute lg:after:inset-y-0 lg:after:left-full lg:after:w-screen lg:after:bg-sage">
          <div className="mx-auto max-w-[44rem] space-y-8 lg:mx-0 lg:max-w-[36rem]">
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
          </div>
        </aside>
      </div>
    </div>
  );
}
