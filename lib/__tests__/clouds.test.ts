import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SimulationEngine, countNearbyWaterCells, createCloud } from '../engine';
import { CANVAS_HEIGHT, CANVAS_WIDTH, CELL_SIZE, DEFAULT_SIM_CONFIG } from '../constants';
import { createBaseGrid } from '../presets';
import { CellState, ClimateSeason } from '../types';

// Regras da referência: leonardo-Trex/automato-finito-FSI,
// mudancas-adicionadas-gustavo-samuel @ 37f31204756e7208c507b264cde250e7a82e764a.
describe('Nuvens de chuva — compatibilidade com a implementação original', () => {
  beforeEach(() => {
    // Sem entradas aleatórias pelas bordas, condensação ou mortalidade nos testes.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  afterEach(() => vi.restoreAllMocks());

  function dryEngine() {
    return new SimulationEngine(createBaseGrid(10, 10), { disperserCount: 0 });
  }

  function cover(engine: SimulationEngine, col = 5, row = 5) {
    const cloud = createCloud(1, col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2);
    cloud.radius = 1; // Isola a célula-alvo das vizinhas.
    cloud.life = 100;
    engine.clouds.push(cloud);
    return cloud;
  }

  it('conta o centro e os oito vizinhos para detectar corpos de água densos', () => {
    const grid = createBaseGrid(5, 5);
    for (const [row, col] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      grid[row][col].state = CellState.LEITO_AGUA;
    }
    expect(countNearbyWaterCells(grid, { col: 0, row: 0 })).toBe(4);
    expect(countNearbyWaterCells(grid, { col: 4, row: 4 })).toBe(0);
  });

  it('preserva tamanho, duração e velocidade iniciais da referência', () => {
    vi.mocked(Math.random).mockReturnValue(0);
    const cloud = createCloud(1, 100, 100);
    expect(cloud).toMatchObject({ x: 100, y: 100, radius: 22, life: 75, vx: 0.4, vy: 0, opacity: 0.85 });
    vi.mocked(Math.random).mockReturnValue(0.999);
    const largest = createCloud(2, 0, 0, 0, 0);
    expect(largest.radius).toBeLessThan(30);
    expect(largest.life).toBe(119);
    expect(largest.vx).toBe(0);
    expect(largest.vy).toBe(0);
  });

  it('condensa com 25% de chance sobre agrupamentos de pelo menos quatro canais', () => {
    const grid = createBaseGrid(5, 5);
    for (const [row, col] of [[2, 2], [2, 1], [1, 2], [3, 2]]) {
      grid[row][col].state = CellState.LEITO_AGUA;
    }
    const engine = new SimulationEngine(grid, { disperserCount: 0 });
    vi.mocked(Math.random).mockReturnValueOnce(0.25);
    engine.updateCloudsTick();
    expect(engine.clouds).toHaveLength(0);
    vi.mocked(Math.random).mockReturnValueOnce(0.249);
    engine.updateCloudsTick();
    expect(engine.clouds).toHaveLength(1);
    expect(countNearbyWaterCells(engine.grid, {
      col: Math.floor(engine.clouds[0].x / CELL_SIZE),
      row: Math.floor(engine.clouds[0].y / CELL_SIZE),
    })).toBeGreaterThanOrEqual(4);
  });

  it.each([0, 1, 2, 3])('recebe nuvens pela borda %i com direção para dentro do mapa', (edge) => {
    const engine = dryEngine();
    vi.mocked(Math.random).mockReturnValueOnce(0.049).mockReturnValueOnce(edge / 4);
    engine.updateCloudsTick();
    expect(engine.clouds).toHaveLength(1);
    const cloud = engine.clouds[0];
    if (edge === 0) { expect(cloud.y).toBe(-15); expect(cloud.vy).toBeGreaterThan(0); }
    if (edge === 1) { expect(cloud.y).toBe(CANVAS_HEIGHT + 15); expect(cloud.vy).toBeLessThan(0); }
    if (edge === 2) { expect(cloud.x).toBe(-15); expect(cloud.vx).toBeGreaterThan(0); }
    if (edge === 3) { expect(cloud.x).toBe(CANVAS_WIDTH + 15); expect(cloud.vx).toBeLessThan(0); }
  });

  it('não recebe nuvens pela borda quando a rolagem é exatamente 5%', () => {
    const engine = dryEngine();
    vi.mocked(Math.random).mockReturnValue(0.05);
    engine.updateCloudsTick();
    expect(engine.clouds).toHaveLength(0);
  });

  it('limita a oito nuvens e remove as que chegam ao fim da vida', () => {
    const engine = dryEngine();
    engine.clouds = Array.from({ length: 8 }, (_, id) => createCloud(id, -100, -100));
    engine.clouds[0].life = 1;
    vi.mocked(Math.random).mockReturnValue(0);
    engine.updateCloudsTick();
    expect(engine.clouds).toHaveLength(7);
    engine.updateCloudsTick();
    expect(engine.clouds).toHaveLength(8);
    expect(engine.getMetrics().cloudCount).toBe(8);
  });

  it('dissipa todas as nuvens ao entrar na estação seca', () => {
    const engine = dryEngine();
    cover(engine);
    engine.seasonTickCounter = engine.config.seasonDurationTicks - 1;
    engine.step();
    expect(engine.season).toBe(ClimateSeason.SECA);
    expect(engine.clouds).toHaveLength(0);
  });

  it.each([[0.699, CellState.SOLO_FERTIL], [0.70, CellState.SOLO_SECO]])(
    'aplica o limite de 70%% de chuva sobre solo seco (rolagem %s)', (roll, expected) => {
      const engine = dryEngine();
      cover(engine);
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValueOnce(roll);
      engine.updateCloudsTick();
      expect(engine.grid[5][5].state).toBe(expected);
      expect(engine.grid[5][5].cloudMoisture ?? 0).toBe(expected === CellState.SOLO_FERTIL ? 25 : 0);
      expect(engine.grid[5][6].state).toBe(CellState.SOLO_SECO);
    },
  );

  it('mantém solo fértil por 25 ticks de umidade mais 20 ticks de retenção', () => {
    const engine = dryEngine();
    engine.season = ClimateSeason.SECA;
    Object.assign(engine.grid[5][5], { state: CellState.SOLO_FERTIL, age: 0, cloudMoisture: 25 });
    for (let i = 0; i < 25; i++) engine.step();
    expect(engine.grid[5][5]).toMatchObject({ state: CellState.SOLO_FERTIL, age: 0, cloudMoisture: 0 });
    for (let i = 0; i < 19; i++) engine.step();
    expect(engine.grid[5][5].state).toBe(CellState.SOLO_FERTIL);
    engine.step();
    expect(engine.grid[5][5].state).toBe(CellState.SOLO_SECO);
  });

  it.each([[0.199, CellState.BROTO], [0.20, CellState.SEMENTE]])(
    'aplica a chance original de 20%% de germinação (rolagem %s)', (roll, expected) => {
      expect(DEFAULT_SIM_CONFIG.cloudSeedGerminationProbability).toBe(0.20);
      const engine = dryEngine();
      engine.grid[5][5].state = CellState.SEMENTE;
      cover(engine);
      vi.mocked(Math.random).mockReturnValueOnce(0.99).mockReturnValueOnce(roll);
      engine.updateCloudsTick();
      expect(engine.grid[5][5].state).toBe(expected);
      expect(engine.seedsGerminated).toBe(expected === CellState.BROTO ? 1 : 0);
      expect(engine.grid[5][5].cloudMoisture ?? 0).toBe(expected === CellState.BROTO ? 25 : 0);
    },
  );

  it('faz só uma tentativa sob cobertura contínua, inclusive com nuvens sobrepostas', () => {
    const engine = dryEngine();
    engine.grid[5][5].state = CellState.SEMENTE;
    cover(engine);
    const second = cover(engine);
    second.id = 2;
    engine.updateCloudsTick(); // Falha com rolagem 0.99.
    engine.config.cloudSeedGerminationProbability = 1;
    for (let i = 0; i < 5; i++) engine.step();
    expect(engine.grid[5][5]).toMatchObject({ state: CellState.SEMENTE, hasReceivedCloud: true });
    expect(engine.grid[5][5].cloudMoisture ?? 0).toBe(0);
    engine.clouds = [];
    engine.updateCloudsTick();
    expect(engine.grid[5][5].hasReceivedCloud).toBe(false);
    cover(engine);
    engine.updateCloudsTick();
    expect(engine.grid[5][5].state).toBe(CellState.BROTO);
  });

  it('uma tentativa falha não germina indiretamente pela reserva de umidade', () => {
    const engine = dryEngine();
    engine.config.cloudSeedGerminationProbability = 0;
    engine.grid[5][5].state = CellState.SEMENTE;
    cover(engine);
    for (let i = 0; i < engine.config.seedDecayCycles; i++) engine.step();
    expect(engine.grid[5][5].state).toBe(CellState.SOLO_SECO);
    expect(engine.seedsGerminated).toBe(0);
    expect(engine.seedsLost).toBe(1);
  });

  it('rega brotos e permite que amadureçam longe do rio', () => {
    const engine = dryEngine();
    Object.assign(engine.grid[5][5], { state: CellState.BROTO, age: 0, cloudMoisture: 1 });
    cover(engine);
    engine.updateCloudsTick();
    expect(engine.grid[5][5].cloudMoisture).toBe(25);
    engine.clouds = [];
    for (let i = 0; i < engine.config.sproutToTreeTicks; i++) engine.step();
    expect(engine.grid[5][5].state).toBe(CellState.ARVORE_ADULTA);
  });

  it('protege o rio por 30 ticks de seca e permite evaporação quando a reserva acaba', () => {
    const engine = dryEngine();
    engine.grid[5][5].state = CellState.LEITO_AGUA;
    cover(engine);
    engine.updateCloudsTick();
    expect(engine.grid[5][5].cloudMoisture).toBe(30);
    engine.season = ClimateSeason.SECA;
    engine.config.evaporationProbabilityDry = 1;
    for (let i = 0; i < 30; i++) engine.step();
    expect(engine.grid[5][5]).toMatchObject({ state: CellState.LEITO_AGUA, cloudMoisture: 0 });
    engine.step();
    expect(engine.grid[5][5].state).toBe(CellState.LEITO_SECO);
  });

  it('move nuvens suavemente, limita a velocidade e reaparece pela borda oposta', () => {
    const engine = dryEngine();
    const cloud = cover(engine);
    cloud.vx = 2;
    cloud.vy = 2;
    engine.updateCloudsMotion();
    expect(Math.hypot(cloud.vx, cloud.vy)).toBeCloseTo(0.85);
    expect(cloud.x).toBeGreaterThan(110);
    cloud.x = CANVAS_WIDTH + cloud.radius + 21;
    engine.updateCloudsMotion();
    expect(cloud.x).toBe(-cloud.radius - 20);
  });

  it('respeita a pausa, o passo manual e os ajustes sem apagar as nuvens', () => {
    const engine = dryEngine();
    const cloud = cover(engine);
    const initial = { ...cloud };
    engine.running = false;
    engine.updateCloudsMotion();
    expect(cloud).toEqual(initial);
    engine.setSpeed(4);
    engine.setDisperserCount(0);
    engine.setWaterRadius(4);
    expect(engine.clouds[0]).toBe(cloud);
    engine.step();
    expect(cloud.life).toBe(initial.life - 1);
    expect(cloud.x).toBe(initial.x);
  });

  it('limpa nuvens e umidade ao carregar outro cenário ou reiniciar', () => {
    const engine = dryEngine();
    cover(engine);
    engine.grid[5][5].cloudMoisture = 25;
    engine.loadGrid(createBaseGrid(10, 10));
    expect(engine.clouds).toHaveLength(0);
    expect(engine.grid[5][5].cloudMoisture).toBeUndefined();
    cover(engine);
    engine.reset();
    expect(engine.clouds).toHaveLength(0);
    expect(engine.totalTicks).toBe(0);
  });
});
