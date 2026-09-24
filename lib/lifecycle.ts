/**
 * Plantae Evolution — Motor de Ontogenia e Ciclo de Vida da Planta
 *
 * Controla as transições ontogenéticas das células (semente → broto → madura),
 * a progressão temporal por ticks e a permanência infinita do estado maduro.
 *
 * Referência: AGENTS.md § 4.3 (Ontogenia e Ciclo de Vida da Planta)
 */

import type { Cell, Grid } from '@/types/simulation';
import { forEachCell } from '@/lib/grid';

/**
 * Ticks necessários para transição de semente para broto.
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 16 ticks correspondem a ~4 segundos.
 */
export const TICKS_SEED_TO_SPROUT = 16;

/**
 * Ticks necessários para transição de broto para madura.
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 24 ticks correspondem a ~6 segundos.
 * Tempo total acumulado de semente até madura: ~10 segundos (40 ticks).
 */
export const TICKS_SPROUT_TO_MATURE = 24;

/**
 * Ticks que a planta madura aguarda antes de entrar em florescência/reprodução.
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 20 ticks correspondem a ~5 segundos.
 */
export const TICKS_MATURE_TO_BLOOM = 20;

/**
 * Ticks que a planta permanece em fase de florescência antes de retornar a madura.
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 8 ticks correspondem a ~2 segundos.
 */
export const TICKS_BLOOM_DURATION = 8;

/**
 * Avança a idade e atualiza o estado ontogenético de uma célula individual.
 *
 * Ciclo de vida:
 * - 'empty': noop (célula desocupada não progride).
 * - 'seed': incrementa idade; ao atingir TICKS_SEED_TO_SPROUT, transiciona para 'sprout' e zera a idade.
 * - 'sprout': incrementa idade; ao atingir TICKS_SPROUT_TO_MATURE, transiciona para 'mature' e zera a idade.
 * - 'mature': incrementa idade; ao atingir TICKS_MATURE_TO_BLOOM, entra em florescência ('bloom') e zera a idade.
 * - 'bloom': incrementa idade; ao atingir TICKS_BLOOM_DURATION, retorna a 'mature' e zera a idade.
 *
 * @param cell Célula a ser atualizada in-place.
 */
export function advanceCell(
  cell: Cell,
  ticksSeedToSprout: number = TICKS_SEED_TO_SPROUT,
  ticksSproutToMature: number = TICKS_SPROUT_TO_MATURE,
  ticksMatureToBloom: number = TICKS_MATURE_TO_BLOOM,
  ticksBloomDuration: number = TICKS_BLOOM_DURATION,
): void {
  switch (cell.estado) {
    case 'seed':
      cell.idade += 1;
      if (cell.idade >= ticksSeedToSprout) {
        cell.estado = 'sprout';
        cell.idade = 0;
      }
      break;

    case 'sprout':
      cell.idade += 1;
      if (cell.idade >= ticksSproutToMature) {
        cell.estado = 'mature';
        cell.idade = 0;
      }
      break;

    case 'mature':
      // Ciclo contínuo / alternância reprodutiva: após maturidade, floresce ciclicamente
      cell.idade += 1;
      if (cell.idade >= ticksMatureToBloom) {
        cell.estado = 'bloom';
        cell.idade = 0;
      }
      break;

    case 'bloom':
      // Florescência ativa: após o período reprodutivo, retorna a mature
      cell.idade += 1;
      if (cell.idade >= ticksBloomDuration) {
        cell.estado = 'mature';
        cell.idade = 0;
      }
      break;

    case 'empty':
    default:
      break;
  }
}

/**
 * Avança o ciclo de vida de todas as células da matriz da simulação.
 * Deve ser executado a cada tick lógico disparado pelo motor de simulação.
 *
 * @param grid Matriz bidimensional de células.
 */
export function advanceGrid(
  grid: Grid,
  ticksSeedToSprout: number = TICKS_SEED_TO_SPROUT,
  ticksSproutToMature: number = TICKS_SPROUT_TO_MATURE,
  ticksMatureToBloom: number = TICKS_MATURE_TO_BLOOM,
  ticksBloomDuration: number = TICKS_BLOOM_DURATION,
): void {
  forEachCell(grid, (cell) => {
    if (cell.estado !== 'empty') {
      advanceCell(
        cell,
        ticksSeedToSprout,
        ticksSproutToMature,
        ticksMatureToBloom,
        ticksBloomDuration,
      );
    }
  });
}
