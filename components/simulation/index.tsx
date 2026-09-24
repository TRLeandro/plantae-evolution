'use client';

import dynamic from 'next/dynamic';

/**
 * Exportação dinâmica do SimulationCanvas com SSR desabilitado.
 *
 * O p5.js depende de APIs do browser (window, document, canvas).
 * `ssr: false` garante que o componente só é carregado e renderizado no client,
 * prevenindo erros de hidratação e `window is not defined`.
 *
 * O skeleton placeholder respeita a paleta Deep Biosphere.
 */
const SimulationCanvas = dynamic(
  () => import('./SimulationCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center gap-3">
        <div
          className="rounded-lg border border-border-subtle bg-grid-empty animate-pulse"
          style={{ width: 640, height: 480 }}
        />
        <span className="text-sm text-text-muted">Carregando simulação…</span>
      </div>
    ),
  },
);

export default SimulationCanvas;
