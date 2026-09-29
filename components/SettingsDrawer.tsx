'use client';

/**
 * SettingsDrawer — painel deslizante com as configurações da simulação.
 *
 * Desktop (≥ lg): desliza pela direita, largura fixa de 22rem, fundo sálvia.
 * Mobile (< lg): sobe como bottom sheet, até 70vh de altura, arredondado no topo.
 *
 * A simulação NÃO pausa ao abrir: o loop de requestAnimationFrame continua
 * independente. Métricas throttled continuam atualizando via props.
 */

import { useEffect, useRef, useCallback, type ReactNode } from 'react';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function SettingsDrawer({ open, onClose, children }: SettingsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Escape fecha o drawer
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  // Foco e listeners de teclado
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', handleKeyDown);

      // Foca o drawer após a transição iniciar
      requestAnimationFrame(() => {
        drawerRef.current?.focus();
      });
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      // Restaura foco ao fechar
      previousFocus.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  // Clique fora (no backdrop) fecha o drawer
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop transparente (sem escurecer, o canvas fica visível) */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Configurações da simulação"
        aria-modal="true"
        tabIndex={-1}
        className={[
          'fixed z-50 bg-sage overflow-y-auto outline-none',
          // Transição
          'transition-transform duration-300',
          // Desktop: lateral direita
          'lg:inset-y-0 lg:right-0 lg:w-[22rem] lg:border-l lg:border-line',
          open ? 'lg:translate-x-0' : 'lg:translate-x-full',
          // Mobile: bottom sheet
          'max-lg:inset-x-0 max-lg:bottom-0 max-lg:max-h-[70vh] max-lg:rounded-t-lg max-lg:border-t max-lg:border-line',
          open ? 'max-lg:translate-y-0' : 'max-lg:translate-y-full',
          // Quando fechado e sem transição, esconde do leitor de tela
          !open && 'pointer-events-none',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Cabeçalho do drawer */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-sage px-6 py-4">
          <h2 className="text-base font-semibold">Configurações</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-control-border bg-frame text-ink hover:bg-sage cursor-pointer"
            aria-label="Fechar configurações"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 px-6 py-6">{children}</div>
      </div>
    </>
  );
}
