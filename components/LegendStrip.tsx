'use client';

/**
 * LegendStrip — faixa horizontal de legenda sempre visível abaixo do mapa.
 * Extraída do antigo MapFrame para funcionar independente da moldura.
 * Usa os mesmos MapSymbol e fonte condensed da legenda original.
 */

import { CellState } from '@/lib/types';
import MapSymbol, { MapSymbolKind } from '@/components/MapSymbol';

export const LEGEND: Array<{ kind: MapSymbolKind; label: string; text: string }> = [
  { kind: CellState.LEITO_AGUA, label: 'Rio com água', text: 'molha a terra em volta' },
  { kind: CellState.LEITO_SECO, label: 'Rio seco', text: 'evaporou na estiagem' },
  { kind: CellState.SOLO_FERTIL, label: 'Terra úmida', text: 'sementes brotam aqui' },
  { kind: CellState.SOLO_SECO, label: 'Terra seca', text: 'sementes não brotam aqui' },
  { kind: CellState.SEMENTE, label: 'Semente', text: 'vira broto em terra úmida' },
  { kind: CellState.BROTO, label: 'Broto', text: 'cresce até virar árvore' },
  { kind: CellState.ARVORE_ADULTA, label: 'Árvore adulta', text: '3 ou mais seguram o rio' },
  { kind: 'pollinator', label: 'Polinizador', text: 'leva sementes pelo mapa' },
];

export default function LegendStrip() {
  return (
    <div className="mt-3">
      <h2 className="mb-2 text-sm font-semibold">Legenda</h2>
      <ul className="flex flex-wrap gap-x-6 gap-y-1 font-condensed text-sm">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <MapSymbol kind={item.kind} size={16} className="text-ink" />
            <span>
              <span className="font-medium">{item.label}:</span>{' '}
              <span className="text-ink-muted">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
