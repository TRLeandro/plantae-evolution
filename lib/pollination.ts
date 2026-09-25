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
import { canDisperseWithAgent } from '@/lib/species';

/**
 * Quantidade máxima de tentativas consecutivas de plantio
 * quando uma célula-alvo inicial encontra-se ocupada.
 * Referência: AGENTS.md § 4.6
 */
export const MAX_DISPERSAL_RETRIES = 3;

/** Probabilidade padrão de colonização por tick de uma briófita em florescência */
export const DEFAULT_BRYOPHYTE_SPREAD_CHANCE = 0.25;

export interface DispersalOptions {
  /** Tamanho da célula em pixels (padrão: CELL_SIZE = 20) */
  cellSize?: number;
  /** Gerador de números pseudoaleatórios (padrão: Math.random) para testes determinísticos */
  rng?: () => number;
}

export interface BryophyteSpreadOptions {
  /** Gerador de números pseudoaleatórios (padrão: Math.random) para testes determinísticos */
  rng?: () => number;
  /** Probabilidade de tentativa de colonização por tick para cada célula em floração (padrão: 0.25) */
  spreadProbability?: number;
}

/**
 * Tenta realizar a dispersão de sementes a partir do sobrevoo de um agente Vento.
 *
 * Regras ontogenéticas e de colisão (AGENTS.md § 4.5 e § 4.6):
 * 1. Mapeia a posição do agente Vento para uma coordenada do grid.
 * 2. Verifica se a célula-fonte possui uma planta apta à reprodução ('mature' ou 'bloom').
 * 3. Valida se a espécie da planta aceita dispersão por vento (Briófitas NÃO aceitam agentes móveis).
 * 4. Se apta, sorteia células vizinhas adjacentes (vizinhança de Moore) para disseminação.
 * 5. Para cada tentativa (até MAX_DISPERSAL_RETRIES):
 *    - Célula Vazia ('empty'): Sucesso! Semente plantada herdando o tipo da espécie. Retorna true.
 *    - Célula em Florescência ('bloom'): Sucesso silencioso da interação polinizadora. O agente encerra a ação. Retorna false.
 *    - Célula Ocupada ('seed', 'sprout', 'mature'): Bloqueio real. Tenta a próxima vizinha.
 * 6. Se esgotar as tentativas sem sucesso, nenhuma semente é plantada. Retorna false.
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

  const species: PlantType = sourceCell.tipoPlanta ?? 'angiosperm';

  // Validação ecológica: apenas espécies que aceitam dispersão por vento (Pteridófita, Gimnosperma, Angiosperma)
  if (!canDisperseWithAgent(species, 'wind')) {
    return false;
  }

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

/**
 * Realiza o avanço autônomo da propagação de Briófitas por autômato celular.
 *
 * Briófitas não dependem de agentes móveis para dispersão. Durante sua fase
 * reprodutiva ('bloom'), colonizam automaticamente casas vizinhas vazias
 * adjacentes (vizinhança de Moore) ao longo do tempo.
 *
 * @param grid Matriz bidimensional de células
 * @param options Opções de calibração de RNG e probabilidade
 * @returns Quantidade de novas sementes plantadas neste tick
 */
export function spreadBryophytes(
  grid: Grid,
  options?: BryophyteSpreadOptions,
): number {
  const rng = options?.rng ?? Math.random;
  const spreadChance = options?.spreadProbability ?? DEFAULT_BRYOPHYTE_SPREAD_CHANCE;

  // Coleta as fontes de dispersão para evitar mutações concorrentes no mesmo tick
  const bloomBryophytes: Array<{ row: number; col: number }> = [];

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.estado === 'bloom' && cell.tipoPlanta === 'bryophyte') {
        bloomBryophytes.push({ row: r, col: c });
      }
    }
  }

  let plantedCount = 0;

  for (const { row, col } of bloomBryophytes) {
    if (rng() >= spreadChance) {
      continue;
    }

    const neighbors = getNeighbors(grid, { row, col });
    const emptyNeighbors = neighbors.filter((n) => n.cell.estado === 'empty');

    if (emptyNeighbors.length === 0) {
      continue;
    }

    // Escolhe um vizinho vazio aleatório
    const targetIdx = Math.floor(rng() * emptyNeighbors.length);
    const target = emptyNeighbors[targetIdx];

    setCell(grid, target.coord, {
      estado: 'seed',
      tipoPlanta: 'bryophyte',
      idade: 0,
    });
    plantedCount++;
  }

  return plantedCount;
}

