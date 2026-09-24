/**
 * Plantae Evolution — Agente Vento (Movimento & Dispersão Abiótica)
 *
 * Módulo puro responsável pela criação, parametrização e avanço
 * da movimentação do agente Vento sobre o canvas da simulação.
 *
 * Implementa o modelo de "Brisa Ondulatória": velocidade base horizontal,
 * variação aleatória de direção (rajadas/turbulência) e oscilação senoidal vertical,
 * com wrap-around periódico pelas bordas do canvas.
 *
 * Referência: AGENTS.md § 4.5 (Agentes Polinizadores & Dispersão)
 */

import type { GridCoord, WindAgent } from '@/types/simulation';

// ---------------------------------------------------------------------------
// Constantes e Parâmetros de Calibração da Brisa
// ---------------------------------------------------------------------------

/** Quantidade padrão de partículas/agentes de vento ativos simultaneamente */
export const DEFAULT_WIND_AGENT_COUNT = 6;

/** Velocidade escalar base do vento em pixels por frame (~48 px/s a 60 FPS) */
export const WIND_BASE_SPEED = 0.8;

/** Variação permitida na velocidade base para criar heterogeneidade entre rajadas */
export const WIND_SPEED_VARIATION = 0.4;

/** Amplitude máxima da ondulação senoidal vertical em pixels */
export const WIND_WAVE_AMPLITUDE = 0.7;

/** Frequência da oscilação senoidal em radianos por frame */
export const WIND_WAVE_FREQUENCY = 0.035;

/** Força da turbulência/deriva angular aleatória por frame (em radianos) */
export const WIND_TURBULENCE_STRENGTH = 0.012;

/** Abertura angular máxima da brisa em relação ao eixo horizontal (+/- radianos) */
export const WIND_MAX_ANGLE = Math.PI / 4; // ~45 graus

/** Margem além das bordas do canvas antes de aplicar wrap-around (em pixels) */
export const WIND_MARGIN = 20;

// ---------------------------------------------------------------------------
// Opções de Simulação do Vento
// ---------------------------------------------------------------------------

export interface AdvanceWindOptions {
  /** Habilitar variação/turbulência aleatória de direção a cada frame */
  enableTurbulence?: boolean;
  /** Amplitude da onda vertical personalizada */
  waveAmplitude?: number;
  /** Frequência da onda vertical personalizada */
  waveFrequency?: number;
  /** Margem de wrap-around */
  margin?: number;
}

// ---------------------------------------------------------------------------
// Fábrica de Agentes
// ---------------------------------------------------------------------------

/**
 * Cria uma instância individual do agente Vento com posição e velocidade inicial.
 * Suporta sobreposição de parâmetros para testes determinísticos.
 */
export function createWindAgent(
  canvasWidth: number,
  canvasHeight: number,
  overrides?: Partial<WindAgent>,
): WindAgent {
  const baseSpeed =
    overrides?.baseSpeed ??
    WIND_BASE_SPEED + (Math.random() - 0.5) * WIND_SPEED_VARIATION;

  const angle =
    overrides?.angle ?? (Math.random() - 0.5) * (WIND_MAX_ANGLE * 0.8);

  const vx = overrides?.vx ?? Math.cos(angle) * baseSpeed;
  const vy = overrides?.vy ?? Math.sin(angle) * baseSpeed;

  return {
    x: overrides?.x ?? Math.random() * canvasWidth,
    y: overrides?.y ?? Math.random() * canvasHeight,
    vx,
    vy,
    waveOffset: overrides?.waveOffset ?? Math.random() * Math.PI * 2,
    baseSpeed,
    angle,
  };
}

/**
 * Cria uma coleção de múltiplos agentes Vento dispersos pela matriz.
 */
export function createWindAgents(
  count: number = DEFAULT_WIND_AGENT_COUNT,
  canvasWidth: number,
  canvasHeight: number,
): WindAgent[] {
  return Array.from({ length: count }, () =>
    createWindAgent(canvasWidth, canvasHeight),
  );
}

// ---------------------------------------------------------------------------
// Movimentação & Cinemática do Vento
// ---------------------------------------------------------------------------

/**
 * Avança a posição do agente Vento um quadro (frame) no tempo.
 *
 * Atualiza:
 * 1. Perturbação angular aleatória (turbulência contínua da brisa).
 * 2. Translação pelo vetor de velocidade (vx, vy).
 * 3. Oscilação ondulatória transversal (senóide).
 * 4. Reposicionamento periódico (wrap-around) ao cruzar os limites do canvas.
 */
export function advanceWindAgent(
  agent: WindAgent,
  frameCount: number,
  canvasWidth: number,
  canvasHeight: number,
  options?: AdvanceWindOptions,
): void {
  const enableTurbulence = options?.enableTurbulence ?? true;
  const waveAmplitude = options?.waveAmplitude ?? WIND_WAVE_AMPLITUDE;
  const waveFrequency = options?.waveFrequency ?? WIND_WAVE_FREQUENCY;
  const margin = options?.margin ?? WIND_MARGIN;

  // 1. Turbulência orgânica: leve variação aleatória contínua na direção
  if (enableTurbulence) {
    const angleDelta = (Math.random() - 0.5) * WIND_TURBULENCE_STRENGTH;
    agent.angle = Math.max(
      -WIND_MAX_ANGLE,
      Math.min(WIND_MAX_ANGLE, agent.angle + angleDelta),
    );
    agent.vx = Math.cos(agent.angle) * agent.baseSpeed;
    agent.vy = Math.sin(agent.angle) * agent.baseSpeed;
  }

  // 2. Translação física básica
  agent.x += agent.vx;
  agent.y += agent.vy;

  // 3. Adiciona componente senoidal perpendicular (oscilação ondulatória vertical)
  const wave = Math.sin(frameCount * waveFrequency + agent.waveOffset) * waveAmplitude;
  agent.y += wave;

  // 4. Wrap-around periódico nas bordas do canvas
  // Borda Direita -> Reentra na Esquerda com nova altitude e brisa refrescada
  if (agent.x > canvasWidth + margin) {
    agent.x = -margin;
    if (enableTurbulence) {
      agent.y = Math.random() * canvasHeight;
      agent.waveOffset = Math.random() * Math.PI * 2;
      agent.angle = (Math.random() - 0.5) * (WIND_MAX_ANGLE * 0.8);
      agent.baseSpeed =
        WIND_BASE_SPEED + (Math.random() - 0.5) * WIND_SPEED_VARIATION;
      agent.vx = Math.cos(agent.angle) * agent.baseSpeed;
      agent.vy = Math.sin(agent.angle) * agent.baseSpeed;
    }
  } else if (agent.x < -margin) {
    // Borda Esquerda -> Reentra na Direita
    agent.x = canvasWidth + margin;
  }

  // Borda Inferior / Superior -> Wrap vertical contínuo
  if (agent.y > canvasHeight + margin) {
    agent.y = -margin;
  } else if (agent.y < -margin) {
    agent.y = canvasHeight + margin;
  }
}

/**
 * Converte a posição contínua em pixels do agente Vento para as coordenadas
 * discretas da célula (col, row) da matriz.
 */
export function getWindGridCoord(
  agent: WindAgent,
  cellSize: number = 20,
): GridCoord {
  return {
    col: Math.floor(agent.x / cellSize),
    row: Math.floor(agent.y / cellSize),
  };
}
