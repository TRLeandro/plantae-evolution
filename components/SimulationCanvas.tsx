'use client';

/**
 * SimulationCanvas — Componente React que hospeda o canvas p5.js.
 *
 * Carrega o p5.js via dynamic import no useEffect para evitar falhas
 * de SSR/hidratação (p5 depende de `window` e `document`).
 */

import { useEffect, useRef } from 'react';
import type p5 from 'p5';

export default function SimulationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Dynamic imports — client-only
      const [{ default: P5 }, { createSketch }] = await Promise.all([
        import('p5'),
        import('@/lib/sketch'),
      ]);

      if (cancelled || !containerRef.current) return;

      // Cria a instância do p5 dentro do container DOM
      p5InstanceRef.current = new P5(createSketch(), containerRef.current);
    }

    init();

    return () => {
      cancelled = true;
      p5InstanceRef.current?.remove();
      p5InstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center overflow-hidden"
    />
  );
}
