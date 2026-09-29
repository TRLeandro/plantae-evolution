'use client';

/**
 * ControlBar — controles da simulação, divididos em peças que a página
 * posiciona perto de onde são usadas:
 * - BrushPicker: os 7 pincéis (fica logo acima do mapa).
 * - PlaybackControls: pausar/continuar, avançar 1 tick, reiniciar.
 * - ScenarioPicker: os 4 cenários de partida.
 * - SimulationSettings: velocidade, alcance da água e polinizadores.
 */

import { BrushTool, CellState } from '@/lib/types';
import { PRESETS } from '@/lib/presets';
import MapSymbol, { MapSymbolKind } from '@/components/MapSymbol';

// Estados compartilhados por todos os botões (ver DESIGN.md › Botões).
// Selecionado = fundo de tinta, texto claro. Foco de teclado = contorno
// externo em tinta (globals.css). Nenhum dos dois usa cor saturada.
export const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm ' +
  'transition-colors cursor-pointer ' +
  'active:translate-y-px ' +
  'disabled:cursor-not-allowed disabled:active:translate-y-0 ' +
  'disabled:border-line disabled:bg-transparent disabled:text-ink-muted';

export const buttonIdle = 'border-control-border bg-frame text-ink hover:bg-sage';

export const buttonSelected = 'border-ink bg-ink text-mist font-medium hover:bg-ink';

// ---------------------------------------------------------------------------
// Pincéis
// ---------------------------------------------------------------------------

export const BRUSHES: Array<{ id: BrushTool; label: string; hint: string; symbol: MapSymbolKind }> = [
  {
    id: 'plant_tree',
    label: 'Árvore',
    hint: 'Planta uma árvore adulta.',
    symbol: CellState.ARVORE_ADULTA,
  },
  {
    id: 'plant_seed',
    label: 'Semente',
    hint: 'Deixa uma semente. Ela só brota em terra úmida.',
    symbol: CellState.SEMENTE,
  },
  {
    id: 'deforest',
    label: 'Desmatar',
    hint: 'Tira árvores, brotos e sementes. Sobra terra.',
    symbol: 'deforest',
  },
  {
    id: 'water_channel',
    label: 'Rio',
    hint: 'Abre um trecho de rio com água.',
    symbol: CellState.LEITO_AGUA,
  },
  {
    id: 'dry_channel',
    label: 'Secar rio',
    hint: 'Seca um trecho de rio que tem água.',
    symbol: CellState.LEITO_SECO,
  },
  {
    id: 'dry_soil',
    label: 'Terra seca',
    hint: 'Troca o que houver na célula por terra seca.',
    symbol: CellState.SOLO_SECO,
  },
  {
    id: 'inspect',
    label: 'Só olhar',
    hint: 'Não muda nada. Serve para ver o que tem em cada célula.',
    symbol: 'none',
  },
];

export function BrushPicker({
  activeBrush,
  onSelectBrush,
}: {
  activeBrush: BrushTool;
  onSelectBrush: (brush: BrushTool) => void;
}) {
  const active = BRUSHES.find((b) => b.id === activeBrush);

  return (
    <div role="group" aria-labelledby="brush-heading">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="brush-heading" className="text-base font-semibold">
          Pincel
        </h2>
        <p className="text-sm text-ink-muted">Clique ou arraste no mapa. {active?.hint}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {BRUSHES.map((b) => {
          const isSelected = activeBrush === b.id;
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectBrush(b.id)}
              className={`${buttonBase} ${isSelected ? buttonSelected : buttonIdle} flex-col gap-1 px-1 py-2 whitespace-nowrap`}
            >
              <MapSymbol kind={b.symbol} />
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reprodução
// ---------------------------------------------------------------------------

export function PlaybackControls({
  running,
  onTogglePlay,
  onStep,
  onReset,
}: {
  running: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onTogglePlay}
        className={`${buttonBase} ${buttonIdle} min-w-24 font-medium`}
      >
        {running ? 'Pausar' : 'Continuar'}
      </button>
      <button
        type="button"
        onClick={onStep}
        disabled={running}
        title={running ? 'Pause a simulação para avançar um tick de cada vez' : undefined}
        className={`${buttonBase} ${buttonIdle}`}
      >
        Avançar 1 tick
      </button>
      <button type="button" onClick={onReset} className={`${buttonBase} ${buttonIdle}`}>
        Reiniciar
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cenários
// ---------------------------------------------------------------------------

// Nomes e descrições para a tela; os dados vêm de lib/presets.ts.
const SCENARIO_TEXT: Record<string, { name: string; description: string }> = {
  balanced: {
    name: 'Mata preservada',
    description: 'Margens com mata fechada. O rio atravessa a seca sem perder água.',
  },
  degraded: {
    name: 'Margens desmatadas',
    description: 'Pouca árvore na beira do rio. Na primeira seca, boa parte dele evapora.',
  },
  restoration: {
    name: 'Em recuperação',
    description: 'Restos de mata e alguns corredores. Os polinizadores ajudam a replantar.',
  },
  dry_soil: {
    name: 'Terra seca',
    description: 'Mapa vazio, sem água nem plantas. Bom para montar tudo do zero.',
  },
};

export function ScenarioPicker({
  activePresetId,
  onSelectPreset,
}: {
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
}) {
  const active = SCENARIO_TEXT[activePresetId];

  return (
    <div role="group" aria-labelledby="scenario-heading">
      <h2 id="scenario-heading" className="mb-2 text-base font-semibold">
        Cenário
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(PRESETS).map((p) => {
          const isSelected = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectPreset(p.id)}
              className={`${buttonBase} ${isSelected ? buttonSelected : buttonIdle} justify-start text-left`}
            >
              {SCENARIO_TEXT[p.id]?.name ?? p.name}
            </button>
          );
        })}
      </div>
      {active && <p className="mt-2 text-sm text-ink-muted">{active.description}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------

// A velocidade é o parâmetro real do motor: quantos quadros de animação
// passam entre um tick e o seguinte. Menos quadros = mais rápido.
const FRAMES_MIN = 4;
const FRAMES_MAX = 28;
const DISPLAY_HZ = 60; // quadros por segundo de uma tela comum

function Slider({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  note,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  note?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="font-medium tabular-nums">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={note ? `${id}-note` : undefined}
        className="w-full cursor-pointer"
      />
      {note && (
        <p id={`${id}-note`} className="mt-1 text-xs text-ink-muted">
          {note}
        </p>
      )}
    </div>
  );
}

export function SimulationSettings({
  speed,
  onSpeedChange,
  waterRadius,
  onWaterRadiusChange,
  disperserCount,
  onDisperserCountChange,
}: {
  speed: number;
  onSpeedChange: (speed: number) => void;
  waterRadius: number;
  onWaterRadiusChange: (radius: number) => void;
  disperserCount?: number;
  onDisperserCountChange?: (count: number) => void;
}) {
  const perSecond = Math.round((DISPLAY_HZ / speed) * 10) / 10;
  const count = disperserCount ?? 10;

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold">Ajustes</h2>
      <div className="space-y-4">
        <Slider
          id="speed"
          label="Quadros por tick"
          value={speed}
          display={`1 tick a cada ${speed} quadros`}
          min={FRAMES_MIN}
          max={FRAMES_MAX}
          step={2}
          onChange={onSpeedChange}
          note={`Menos quadros, simulação mais rápida. Numa tela de ${DISPLAY_HZ} quadros por segundo: ${DISPLAY_HZ} ÷ ${speed} = ${perSecond.toLocaleString('pt-BR')} ticks por segundo.`}
        />
        <Slider
          id="water-radius"
          label="Alcance da água no solo"
          value={waterRadius}
          display={`${waterRadius} ${waterRadius === 1 ? 'célula' : 'células'}`}
          min={1}
          max={4}
          step={1}
          onChange={onWaterRadiusChange}
        />
        <Slider
          id="dispersers"
          label="Polinizadores"
          value={count}
          display={String(count)}
          min={0}
          max={30}
          step={1}
          onChange={(v) => onDisperserCountChange?.(v)}
        />
      </div>
    </div>
  );
}
