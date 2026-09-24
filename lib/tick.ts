/**
 * Plantae Evolution — Sistema de Ticks Lógicos
 *
 * Desacopla o avanço da simulação dos ~60 FPS do loop gráfico do p5.js.
 * Controla o acumulador de frames, disparo de ticks lógicos, velocidade e estado de execução.
 *
 * Referência: AGENTS.md § 3.2 (Gerenciamento de Estado e Performance)
 */

import type { TickState } from '@/types/simulation';

/**
 * Quantidade padrão de frames p5 por tick lógico.
 * 15 frames a 60 FPS = ~4 ticks lógicos por segundo (ritmo dinâmico).
 */
export const DEFAULT_FRAMES_PER_TICK = 15;

/**
 * Cria o estado inicial do sistema de ticks.
 *
 * @param framesPerTick Quantidade de frames p5 para cada tick lógico (mínimo 1).
 */
export function createTickState(
  framesPerTick: number = DEFAULT_FRAMES_PER_TICK,
): TickState {
  return {
    frameAccumulator: 0,
    framesPerTick: Math.max(1, Math.floor(framesPerTick)),
    totalTicks: 0,
    running: true,
  };
}

/**
 * Avança um frame do contador e determina se um tick lógico deve ser disparado.
 *
 * Deve ser chamado exatamente uma vez por quadro no `draw()` do p5.
 * Se a simulação estiver pausada (`running === false`), o acumulador não é incrementado
 * e a função retorna false.
 *
 * @param state Estado atual do sistema de ticks
 * @returns `true` se um tick lógico foi disparado neste frame, `false` caso contrário
 */
export function advanceFrame(state: TickState): boolean {
  if (!state.running) {
    return false;
  }

  state.frameAccumulator += 1;

  if (state.frameAccumulator >= state.framesPerTick) {
    state.frameAccumulator = 0;
    state.totalTicks += 1;
    return true;
  }

  return false;
}

/**
 * Ajusta a velocidade da simulação alterando a quantidade de frames por tick.
 *
 * Valores menores representam simulações mais rápidas.
 * Garante um valor mínimo de 1 frame por tick.
 *
 * @param state Estado atual do sistema de ticks
 * @param framesPerTick Nova cadência de frames por tick lógico
 */
export function setSpeed(state: TickState, framesPerTick: number): void {
  state.framesPerTick = Math.max(1, Math.floor(framesPerTick));
}

/**
 * Reseta o contador de ticks e o acumulador de frames para zero.
 *
 * @param state Estado atual do sistema de ticks
 */
export function resetTickState(state: TickState): void {
  state.frameAccumulator = 0;
  state.totalTicks = 0;
}

/**
 * Define se a simulação está em execução ou pausada.
 *
 * @param state Estado atual do sistema de ticks
 * @param running True para rodando, false para pausado
 */
export function setRunning(state: TickState, running: boolean): void {
  state.running = running;
}
