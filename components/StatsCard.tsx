'use client';

/**
 * StatsCard — números da bacia em tempo real:
 * 1. Quanto do rio ainda tem água.
 * 2. Quanto do rio está protegido pela mata ciliar.
 * 3. Quantas sementes brotaram (vs. secaram).
 * 4. Sementes espalhadas pelos polinizadores.
 */

import { SimulationMetrics } from '@/lib/types';

interface StatsCardProps {
  metrics: SimulationMetrics;
}

// "1 broto", "2 brotos"
function count(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

function statusColor(pct: number) {
  if (pct > 70) return 'text-tree-text';
  if (pct > 35) return 'text-soil-text';
  return 'text-rust-text';
}

function Bar({ pct, className }: { pct: number; className: string }) {
  return (
    <div className="mt-2 h-1 bg-line" aria-hidden="true">
      <div className={`h-full transition-[width] duration-300 ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = '',
  children,
}: {
  label: string;
  value: string;
  valueClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line pt-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className={`text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</dd>
      <dd className="text-xs text-ink-muted tabular-nums">{children}</dd>
    </div>
  );
}

export default function StatsCard({ metrics }: StatsCardProps) {
  const resolvedSeeds = metrics.seedsGerminated + metrics.seedsLost;

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="mb-3 text-base font-semibold">
        Como está a bacia
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Stat
          label="Rio com água"
          value={`${metrics.riverPreservationPct}%`}
          valueClass={statusColor(metrics.riverPreservationPct)}
        >
          {count(metrics.activeRiverCells, 'trecho', 'trechos')} com água, {count(metrics.dryRiverCells, 'seco', 'secos')}
          <Bar
            pct={metrics.riverPreservationPct}
            className={metrics.riverPreservationPct > 35 ? 'bg-map-water' : 'bg-map-rust'}
          />
        </Stat>

        <Stat
          label="Rio protegido pela mata"
          value={`${metrics.riparianDensityPct}%`}
          valueClass={statusColor(metrics.riparianDensityPct)}
        >
          {count(metrics.adultTreeCount, 'árvore adulta', 'árvores adultas')}, {count(metrics.sproutCount, 'broto', 'brotos')}
          <Bar pct={metrics.riparianDensityPct} className="bg-map-tree" />
        </Stat>

        <Stat
          label="Sementes que brotaram"
          value={resolvedSeeds > 0 ? `${metrics.effectiveGerminationRate}%` : '—'}
        >
          {resolvedSeeds > 0
            ? `${metrics.seedsGerminated} ${metrics.seedsGerminated === 1 ? 'brotou' : 'brotaram'}, ${metrics.seedsLost} ${metrics.seedsLost === 1 ? 'secou' : 'secaram'}`
            : 'Nenhuma semente germinou ou secou ainda'}
          {resolvedSeeds > 0 && <Bar pct={metrics.effectiveGerminationRate} className="bg-map-seed" />}
        </Stat>

        <Stat label="Sementes espalhadas" value={String(metrics.totalSeedsDropped)}>
          {metrics.seedCount} no chão agora, {count(metrics.disperserCount ?? 10, 'polinizador', 'polinizadores')}
        </Stat>
      </dl>
    </section>
  );
}
