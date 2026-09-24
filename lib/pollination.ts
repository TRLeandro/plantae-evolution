/**
 * Plantae Evolution — Motor de Dispersão e Polinização
 *
 * Módulo puro responsável pelas regras de dispersão biológica e abiótica
 * das espécies vegetais por agentes polinizadores (Vento, Abelha, Pássaro).
 *
 * Referência: AGENTS.md § 4.5 e § 4.6 (Regras de Colisão e Propagação)
 */

import type { Grid, WindAgent, PlantType } from '@/types/simulation';
import { CELL_SIZE, getCell, getNeighbors, isValidCoord, setCell } from '@/lib/grid';
import { getWindGridCoord } from '@/lib/wind';

/**
 * Quantidade máxima de tentativas consecutivas de plantio
 * quando uma célula-alvo inicial encontra-se ocupada.
 * Referência: AGENTS.md § 4.6
 */
export const MAX_DISPERSAL_RETRIES = 3;

export interface DispersalOptions {
  /** Tamanho da célula em pixels (padrão: CELL_SIZE = 20) */
  cellSize?: number;
  /** Gerador de números pseudoaleatórios (padrão: Math.random) para testes determinísticos */
  rng?: () => number;
}

/**
 * Tenta realizar a dispersão de sementes a partir do sobrevoo de um agente Vento.
 *
 * Regras ontogenéticas e de colisão (AGENTS.md § 4.6):
 * 1. Mapeia a posição do agente Vento para uma coordenada do grid.
 * 2. Verifica se a célula-fonte possui uma planta apta à reprodução ('mature' ou 'bloom').
 * 3. Se apta, sorteia células vizinhas adjacentes (vizinhança de Moore) para disseminação.
 * 4. Para cada tentativa (até MAX_DISPERSAL_RETRIES):
 *    - Célula Vazia ('empty'): Sucesso! Semente plantada herdando o tipo da espécie. Retorna true.
 *    - Célula em Florescência ('bloom'): Sucesso silencioso da interação polinizadora. O agente encerra a ação. Retorna false.
 *    - Célula Ocupada ('seed', 'sprout', 'mature'): Bloqueio real. Tenta a próxima vizinha.
 * 5. Se esgotar as tentativas sem sucesso, nenhuma semente é plantada. Retorna false.
 *
 * @param grid Matriz da simulação
 * @param agent Agente Vento em movimento
 * @param options Opções de calibração e injeção de RNG
 * @returns true se uma nova semente foi plantada com sucesso, false caso contrário
 */
export function tryWindDispersal(
  grid: Grid,
  agent: WindAgent,
  options?: DispersalOptions,
): boolean {
  const cellSize = options?.cellSize ?? CELL_SIZE;
  const rng = options?.rng ?? Math.random;

  const coord = getWindGridCoord(agent, cellSize);

  // Fora dos limites da matriz (ex: margem de wrap-around)
  if (!isValidCoord(grid, coord)) {
    return false;
  }

  const sourceCell = getCell(grid, coord);
  if (!sourceCell) {
    return false;
  }

  // Apenas plantas maduras ou em florescência podem dispersar sementes/esporos
  if (sourceCell.estado !== 'mature' && sourceCell.estado !== 'bloom') {
    return false;
  }

  const species: PlantType = sourceCell.tipoPlanta ?? 'bryophyte';

  const neighbors = getNeighbors(grid, coord);
  if (neighbors.length === 0) {
    return false;
  }

  // Embaralha os vizinhos usando Fisher-Yates com o RNG fornecido
  const shuffledNeighbors = [...neighbors];
  for (let i = shuffledNeighbors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffledNeighbors[i];
    shuffledNeighbors[i] = shuffledNeighbors[j];
    shuffledNeighbors[j] = temp;
  }

  const attempts = Math.min(shuffledNeighbors.length, MAX_DISPERSAL_RETRIES);

  for (let i = 0; i < attempts; i++) {
    const target = shuffledNeighbors[i];

    // 1. Célula Vazia: Propagação bem-sucedida!
    if (target.cell.estado === 'empty') {
      setCell(grid, target.coord, {
        estado: 'seed',
        tipoPlanta: species,
        idade: 0,
      });
      return true;
    }

    // 2. Célula em Florescência: Sucesso silencioso (interação concluída, agente encerra ação ali)
    if (target.cell.estado === 'bloom') {
      return false;
    }

    // 3. Célula Ocupada ('seed', 'sprout', 'mature'): Bloqueio real, tenta próxima vizinha
  }

  // 4. 3 Tentativas falhas consecutivas: nenhuma propagação
  return false;
}
