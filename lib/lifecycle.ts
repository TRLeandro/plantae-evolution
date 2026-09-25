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
import { getSpeciesConfig } from '@/lib/species';

/**
 * Ticks necessários para transição de semente para broto (referência padrão / fallback).
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 16 ticks correspondem a ~4 segundos.
 */
export const TICKS_SEED_TO_SPROUT = 16;

/**
 * Ticks necessários para transição de broto para madura (referência padrão / fallback).
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 24 ticks correspondem a ~6 segundos.
 * Tempo total acumulado de semente até madura: ~10 segundos (40 ticks).
 */
export const TICKS_SPROUT_TO_MATURE = 24;

/**
 * Ticks que a planta madura aguarda antes de entrar em florescência/reprodução (referência padrão / fallback).
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 20 ticks correspondem a ~5 segundos.
 */
export const TICKS_MATURE_TO_BLOOM = 20;

/**
 * Ticks que a planta permanece em fase de florescência antes de retornar a madura (referência padrão / fallback).
 * Com 15 frames/tick a 60 FPS (~4 ticks/segundo), 8 ticks correspondem a ~2 segundos.
 */
export const TICKS_BLOOM_DURATION = 8;

/**
 * Avança a idade e atualiza o estado ontogenético de uma célula individual.
 *
 * Utiliza o ritmo da espécie associada à célula (`cell.tipoPlanta`) definido no
 * catálogo canônico (`lib/species.ts`). Caso parâmetros específicos de duração
 * sejam fornecidos, estes terão precedência (útil para testes unitários).
 *
 * Ciclo de vida:
 * - 'empty': noop (célula desocupada não progride).
 * - 'seed': incrementa idade; ao atingir a duração de semente, transiciona para 'sprout' e zera a idade.
 * - 'sprout': incrementa idade; ao atingir a duração de broto, transiciona para 'mature' e zera a idade.
 * - 'mature': incrementa idade; ao atingir a maturidade reprodutiva, entra em florescência ('bloom') e zera a idade.
 * - 'bloom': incrementa idade; ao expirar o período reprodutivo, retorna a 'mature' e zera a idade.
 *
 * @param cell Célula a ser atualizada in-place.
 */
export function advanceCell(
  cell: Cell,
  ticksSeedToSprout?: number,
  ticksSproutToMature?: number,
  ticksMatureToBloom?: number,
  ticksBloomDuration?: number,
): void {
  const config = cell.tipoPlanta ? getSpeciesConfig(cell.tipoPlanta) : null;
  const thresholdSeedToSprout =
    ticksSeedToSprout ?? config?.ticksSeedToSprout ?? TICKS_SEED_TO_SPROUT;
  const thresholdSproutToMature =
    ticksSproutToMature ?? config?.ticksSproutToMature ?? TICKS_SPROUT_TO_MATURE;
  const thresholdMatureToBloom =
    ticksMatureToBloom ?? config?.ticksMatureToBloom ?? TICKS_MATURE_TO_BLOOM;
  const thresholdBloomDuration =
    ticksBloomDuration ?? config?.ticksBloomDuration ?? TICKS_BLOOM_DURATION;

  switch (cell.estado) {
    case 'seed':
      cell.idade += 1;
      if (cell.idade >= thresholdSeedToSprout) {
        cell.estado = 'sprout';
        cell.idade = 0;
      }
      break;

    case 'sprout':
      cell.idade += 1;
      if (cell.idade >= thresholdSproutToMature) {
        cell.estado = 'mature';
        cell.idade = 0;
      }
      break;

    case 'mature':
      // Ciclo contínuo / alternância reprodutiva: após maturidade, floresce ciclicamente
      cell.idade += 1;
      if (cell.idade >= thresholdMatureToBloom) {
        cell.estado = 'bloom';
        cell.idade = 0;
      }
      break;

    case 'bloom':
      // Florescência ativa: após o período reprodutivo, retorna a mature
      cell.idade += 1;
      if (cell.idade >= thresholdBloomDuration) {
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
  ticksSeedToSprout?: number,
  ticksSproutToMature?: number,
  ticksMatureToBloom?: number,
  ticksBloomDuration?: number,
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
