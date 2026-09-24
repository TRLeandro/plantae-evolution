import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_FRAMES_PER_TICK,
  createTickState,
  advanceFrame,
  setSpeed,
  resetTickState,
  setRunning,
} from '@/lib/tick';
import type { TickState } from '@/types/simulation';

describe('tick module', () => {
  let tickState: TickState;

  beforeEach(() => {
    tickState = createTickState();
  });

  describe('createTickState', () => {
    it('cria estado padrão com 15 frames por tick (~4 ticks/seg), running true e contadores zerados', () => {
      expect(tickState.framesPerTick).toBe(DEFAULT_FRAMES_PER_TICK);
      expect(tickState.framesPerTick).toBe(15);
      expect(tickState.frameAccumulator).toBe(0);
      expect(tickState.totalTicks).toBe(0);
      expect(tickState.running).toBe(true);
    });

    it('aceita valor customizado de framesPerTick', () => {
      const custom = createTickState(30);
      expect(custom.framesPerTick).toBe(30);
      expect(custom.frameAccumulator).toBe(0);
      expect(custom.totalTicks).toBe(0);
      expect(custom.running).toBe(true);
    });

    it('garante valor mínimo de 1 frame e arredonda decimais', () => {
      const minState = createTickState(0);
      expect(minState.framesPerTick).toBe(1);

      const negativeState = createTickState(-10);
      expect(negativeState.framesPerTick).toBe(1);

      const decimalState = createTickState(14.8);
      expect(decimalState.framesPerTick).toBe(14);
    });
  });

  describe('advanceFrame', () => {
    it('não dispara tick durante frames intermediários e acumula contador', () => {
      const customState = createTickState(5);

      for (let i = 1; i <= 4; i++) {
        const ticked = advanceFrame(customState);
        expect(ticked).toBe(false);
        expect(customState.frameAccumulator).toBe(i);
        expect(customState.totalTicks).toBe(0);
      }
    });

    it('dispara tick ao atingir framesPerTick, reseta acumulador e incrementa totalTicks', () => {
      const customState = createTickState(3);

      expect(advanceFrame(customState)).toBe(false); // frame 1
      expect(advanceFrame(customState)).toBe(false); // frame 2

      const ticked = advanceFrame(customState); // frame 3
      expect(ticked).toBe(true);
      expect(customState.frameAccumulator).toBe(0);
      expect(customState.totalTicks).toBe(1);
    });

    it('dispara ticks de forma cíclica em múltiplos ciclos', () => {
      const customState = createTickState(4);

      // Ciclo 1
      advanceFrame(customState);
      advanceFrame(customState);
      advanceFrame(customState);
      expect(advanceFrame(customState)).toBe(true);
      expect(customState.totalTicks).toBe(1);

      // Ciclo 2
      advanceFrame(customState);
      advanceFrame(customState);
      advanceFrame(customState);
      expect(advanceFrame(customState)).toBe(true);
      expect(customState.totalTicks).toBe(2);

      // Ciclo 3
      advanceFrame(customState);
      advanceFrame(customState);
      advanceFrame(customState);
      expect(advanceFrame(customState)).toBe(true);
      expect(customState.totalTicks).toBe(3);
    });

    it('dispara tick a cada frame quando framesPerTick é 1', () => {
      const fastState = createTickState(1);

      expect(advanceFrame(fastState)).toBe(true);
      expect(fastState.totalTicks).toBe(1);

      expect(advanceFrame(fastState)).toBe(true);
      expect(fastState.totalTicks).toBe(2);
    });

    it('não dispara tick nem incrementa acumulador quando running é false (pausado)', () => {
      tickState.running = false;

      for (let i = 0; i < 20; i++) {
        const ticked = advanceFrame(tickState);
        expect(ticked).toBe(false);
        expect(tickState.frameAccumulator).toBe(0);
        expect(tickState.totalTicks).toBe(0);
      }
    });
  });

  describe('setSpeed', () => {
    it('altera framesPerTick sem resetar acumulador', () => {
      const state = createTickState(20);
      // Avança 5 frames
      for (let i = 0; i < 5; i++) {
        advanceFrame(state);
      }
      expect(state.frameAccumulator).toBe(5);

      setSpeed(state, 10);
      expect(state.framesPerTick).toBe(10);
      expect(state.frameAccumulator).toBe(5);

      // Mais 5 frames devem disparar o tick
      for (let i = 0; i < 4; i++) {
        expect(advanceFrame(state)).toBe(false);
      }
      expect(advanceFrame(state)).toBe(true);
      expect(state.totalTicks).toBe(1);
    });

    it('garante que nova velocidade respeite valor mínimo de 1', () => {
      setSpeed(tickState, 0);
      expect(tickState.framesPerTick).toBe(1);

      setSpeed(tickState, -5);
      expect(tickState.framesPerTick).toBe(1);
    });
  });

  describe('resetTickState', () => {
    it('reseta acumulador e totalTicks sem alterar framesPerTick ou running', () => {
      const state = createTickState(10);
      for (let i = 0; i < 25; i++) {
        advanceFrame(state);
      }
      expect(state.totalTicks).toBe(2);
      expect(state.frameAccumulator).toBe(5);

      resetTickState(state);

      expect(state.frameAccumulator).toBe(0);
      expect(state.totalTicks).toBe(0);
      expect(state.framesPerTick).toBe(10);
      expect(state.running).toBe(true);
    });
  });

  describe('setRunning', () => {
    it('alterna o estado de execução da simulação', () => {
      expect(tickState.running).toBe(true);

      setRunning(tickState, false);
      expect(tickState.running).toBe(false);

      setRunning(tickState, true);
      expect(tickState.running).toBe(true);
    });
  });
});
