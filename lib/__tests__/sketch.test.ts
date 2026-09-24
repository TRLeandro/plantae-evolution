import { describe, it, expect, vi } from 'vitest';
import { createSketch } from '@/lib/sketch';
import type p5 from 'p5';

function createMockP5() {
  const p = {
    setup: () => {},
    draw: () => {},
    createCanvas: vi.fn().mockReturnValue({ style: vi.fn() }),
    frameRate: vi.fn(),
    background: vi.fn(),
    noStroke: vi.fn(),
    stroke: vi.fn(),
    strokeWeight: vi.fn(),
    fill: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    ellipse: vi.fn(),
    mouseX: 0,
    mouseY: 0,
    mouseMoved: () => {},
    mousePressed: () => {},
    touchStarted: () => {},
  } as unknown as p5;

  return p;
}

describe('sketch module - logical tick decoupling', () => {
  it('inicializa com frameRate(60) no setup', () => {
    const p = createMockP5();
    const sketch = createSketch();
    sketch(p);

    p.setup();
    expect(p.frameRate).toHaveBeenCalledWith(60);
  });

  it('dispara tick lógico desacoplado a cada 15 frames padrão do draw()', () => {
    const onTick = vi.fn();
    const p = createMockP5();
    const sketch = createSketch({ onTick });
    sketch(p);

    p.setup();

    // 14 frames não devem disparar onTick
    for (let i = 0; i < 14; i++) {
      p.draw();
    }
    expect(onTick).not.toHaveBeenCalled();

    // 15º frame dispara o primeiro tick
    p.draw();
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenLastCalledWith(1);

    // Próximos 14 frames
    for (let i = 0; i < 14; i++) {
      p.draw();
    }
    expect(onTick).toHaveBeenCalledTimes(1);

    // 30º frame dispara o segundo tick
    p.draw();
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick).toHaveBeenLastCalledWith(2);
  });

  it('respeita framesPerTick customizado (ex: 5 frames por tick)', () => {
    const onTick = vi.fn();
    const p = createMockP5();
    const sketch = createSketch({ framesPerTick: 5, onTick });
    sketch(p);

    p.setup();

    for (let i = 0; i < 5; i++) {
      p.draw();
    }
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenLastCalledWith(1);

    for (let i = 0; i < 5; i++) {
      p.draw();
    }
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick).toHaveBeenLastCalledWith(2);
  });

  it('permite atualização dinâmica de velocidade via getFramesPerTick sem reiniciar o sketch', () => {
    let currentSpeed = 10;
    const onTick = vi.fn();
    const p = createMockP5();
    const sketch = createSketch({
      getFramesPerTick: () => currentSpeed,
      onTick,
    });
    sketch(p);

    p.setup();

    // 10 frames com velocidade 10 -> 1 tick
    for (let i = 0; i < 10; i++) {
      p.draw();
    }
    expect(onTick).toHaveBeenCalledTimes(1);

    // Altera velocidade dinamicamente para 2 frames por tick
    currentSpeed = 2;

    p.draw(); // frame 1
    expect(onTick).toHaveBeenCalledTimes(1);

    p.draw(); // frame 2 -> tick 2 disparado
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick).toHaveBeenLastCalledWith(2);
  });

  describe('wind agents rendering', () => {
    it('renderiza partículas de vento sobre o grid no draw()', () => {
      const p = createMockP5();
      const sketch = createSketch();
      sketch(p);

      p.setup();
      p.draw();

      // Cada agente de vento (3 por padrão) renderiza 4 elipses (halo + principal + 2 tails) = 12 chamadas
      expect(p.ellipse).toHaveBeenCalled();
      expect(p.ellipse).toHaveBeenCalledTimes(12);
    });

    it('respeita quantidade customizada de agentes de vento', () => {
      const p = createMockP5();
      const sketch = createSketch({ windAgentCount: 2 });
      sketch(p);

      p.setup();
      p.draw();

      // 2 agentes * 4 elipses = 8 chamadas
      expect(p.ellipse).toHaveBeenCalledTimes(8);
    });
  });
});
