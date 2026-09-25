import { describe, it, expect, beforeEach } from 'vitest';
import {
  tryWindDispersal,
  spreadBryophytes,
  MAX_DISPERSAL_RETRIES,
} from '@/lib/pollination';
import { createGrid, getCell, setCell, countCellsByState } from '@/lib/grid';
import { createWindAgent } from '@/lib/wind';
import type { Grid, WindAgent } from '@/types/simulation';

describe('pollination module — tryWindDispersal', () => {
  let grid: Grid;
  const CELL_SIZE = 20;

  beforeEach(() => {
    grid = createGrid(5, 5); // Grid 5x5 para testes controlados
  });

  function makeAgentAt(col: number, row: number, overrides?: Partial<WindAgent>): WindAgent {
    return createWindAgent(100, 100, {
      x: col * CELL_SIZE + CELL_SIZE / 2,
      y: row * CELL_SIZE + CELL_SIZE / 2,
      ...overrides,
    });
  }

  describe('condições da célula-fonte e seletividade por espécie', () => {
    it('retorna false quando o agente está fora dos limites do grid', () => {
      const agentOutOfBounds = createWindAgent(100, 100, { x: -15, y: -15 });
      const result = tryWindDispersal(grid, agentOutOfBounds, { cellSize: CELL_SIZE });
      expect(result).toBe(false);
    });

    it('retorna false quando a célula sob o agente está vazia', () => {
      const agent = makeAgentAt(2, 2);
      expect(getCell(grid, { row: 2, col: 2 })?.estado).toBe('empty');

      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });
      expect(result).toBe(false);
      expect(countCellsByState(grid, 'seed')).toBe(0);
    });

    it('retorna false para briófitas mesmo maduras (vento não dispersa briófitas)', () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'mature', tipoPlanta: 'bryophyte', idade: 5 });
      const agent = makeAgentAt(2, 2);

      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });
      expect(result).toBe(false);
      expect(countCellsByState(grid, 'seed')).toBe(0);
    });

    it('retorna false quando a planta sob o agente é apenas uma semente (seed)', () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'seed', tipoPlanta: 'pteridophyte', idade: 5 });
      const agent = makeAgentAt(2, 2);

      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });
      expect(result).toBe(false);
      expect(countCellsByState(grid, 'seed')).toBe(1); // apenas a semente original
    });

    it('retorna false quando a planta sob o agente é um broto (sprout)', () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'sprout', tipoPlanta: 'pteridophyte', idade: 10 });
      const agent = makeAgentAt(2, 2);

      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });
      expect(result).toBe(false);
      expect(countCellsByState(grid, 'seed')).toBe(0);
    });
  });

  describe('dispersão bem-sucedida para espécies compatíveis com vento', () => {
    it('dissemina pteridófita para célula vizinha vazia a partir de planta madura', () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'mature', tipoPlanta: 'pteridophyte', idade: 5 });
      const agent = makeAgentAt(2, 2);

      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });
      expect(result).toBe(true);
      expect(countCellsByState(grid, 'seed')).toBe(1);

      // A nova semente deve ter idade 0 e herdar o tipoPlanta da mãe
      let newSeedFound = false;
      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) {
          if (r === 2 && c === 2) continue;
          const cell = getCell(grid, { row: r, col: c });
          if (cell?.estado === 'seed') {
            newSeedFound = true;
            expect(cell.tipoPlanta).toBe('pteridophyte');
            expect(cell.idade).toBe(0);
          }
        }
      }
      expect(newSeedFound).toBe(true);
    });

    it('dissemina angiosperma para célula vizinha vazia a partir de florescência (bloom)', () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'bloom', tipoPlanta: 'angiosperm', idade: 2 });
      const agent = makeAgentAt(2, 2);

      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });
      expect(result).toBe(true);
      expect(countCellsByState(grid, 'seed')).toBe(1);

      let seedPlantType: string | undefined;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = getCell(grid, { row: r, col: c });
          if (cell?.estado === 'seed') {
            seedPlantType = cell.tipoPlanta;
          }
        }
      }
      expect(seedPlantType).toBe('angiosperm');
    });

    it('herda gymnosperm corretamente quando a planta-mãe é conífera', () => {
      setCell(grid, { row: 1, col: 1 }, { estado: 'mature', tipoPlanta: 'gymnosperm', idade: 10 });
      const agent = makeAgentAt(1, 1);

      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });
      expect(result).toBe(true);

      const seeds: string[] = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = getCell(grid, { row: r, col: c });
          if (cell?.estado === 'seed') seeds.push(cell.tipoPlanta!);
        }
      }
      expect(seeds).toEqual(['gymnosperm']);
    });
  });

  describe('regras de colisão e tentativas (AGENTS.md § 4.6)', () => {
    it('encerra ação sem plantar quando a célula-alvo sorteada está em bloom (sucesso silencioso)', () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'mature', tipoPlanta: 'pteridophyte', idade: 5 });

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          setCell(grid, { row: 2 + dy, col: 2 + dx }, { estado: 'bloom', idade: 1 });
        }
      }

      const agent = makeAgentAt(2, 2);
      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });

      // Sucesso silencioso: ação encerrada sem nova semente
      expect(result).toBe(false);
      expect(countCellsByState(grid, 'seed')).toBe(0);
    });

    it('tenta célula vizinha adjacente quando a primeira está ocupada por planta em crescimento', () => {
      setCell(grid, { row: 0, col: 0 }, { estado: 'mature', tipoPlanta: 'gymnosperm', idade: 5 });

      // Ocupa (0,1) e (1,0) com plantas já existentes
      setCell(grid, { row: 0, col: 1 }, { estado: 'mature', tipoPlanta: 'gymnosperm', idade: 10 });
      setCell(grid, { row: 1, col: 0 }, { estado: 'sprout', tipoPlanta: 'gymnosperm', idade: 8 });

      // Deixa apenas (1,1) vazia
      const agent = makeAgentAt(0, 0);
      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });

      expect(result).toBe(true);
      expect(getCell(grid, { row: 1, col: 1 })?.estado).toBe('seed');
    });

    it(`falha e não planta após ${MAX_DISPERSAL_RETRIES} tentativas quando todas as vizinhas estão ocupadas`, () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'mature', tipoPlanta: 'pteridophyte', idade: 5 });

      // Preenche todos os 8 vizinhos com mature
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          setCell(grid, { row: 2 + dy, col: 2 + dx }, { estado: 'mature', idade: 10 });
        }
      }

      const agent = makeAgentAt(2, 2);
      const result = tryWindDispersal(grid, agent, { cellSize: CELL_SIZE });

      expect(result).toBe(false);
      expect(countCellsByState(grid, 'seed')).toBe(0);
    });
  });

  describe('determinismo com RNG injetado', () => {
    it('comporta-se de maneira reproduzível quando fornecido RNG customizado', () => {
      setCell(grid, { row: 2, col: 2 }, { estado: 'mature', tipoPlanta: 'pteridophyte', idade: 5 });
      const agent = makeAgentAt(2, 2);

      const deterministicRng = () => 0;

      const result = tryWindDispersal(grid, agent, {
        cellSize: CELL_SIZE,
        rng: deterministicRng,
      });

      expect(result).toBe(true);
      expect(countCellsByState(grid, 'seed')).toBe(1);
    });
  });
});

describe('pollination module — spreadBryophytes (Autômato Celular Puro)', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = createGrid(5, 5);
  });

  it('coloniza célula vizinha vazia quando a briófita está em bloom', () => {
    setCell(grid, { row: 2, col: 2 }, { estado: 'bloom', tipoPlanta: 'bryophyte', idade: 1 });

    const planted = spreadBryophytes(grid, { spreadProbability: 1 });
    expect(planted).toBe(1);
    expect(countCellsByState(grid, 'seed')).toBe(1);

    // Confirma que a nova semente é briófita com idade 0 em uma casa vizinha adjacente
    let seedNeighbor = false;
    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= 3; c++) {
        if (r === 2 && c === 2) continue;
        const cell = getCell(grid, { row: r, col: c });
        if (cell?.estado === 'seed') {
          seedNeighbor = true;
          expect(cell.tipoPlanta).toBe('bryophyte');
          expect(cell.idade).toBe(0);
        }
      }
    }
    expect(seedNeighbor).toBe(true);
  });

  it('não coloniza se a briófita estiver apenas madura (mature), somente durante bloom', () => {
    setCell(grid, { row: 2, col: 2 }, { estado: 'mature', tipoPlanta: 'bryophyte', idade: 10 });

    const planted = spreadBryophytes(grid, { spreadProbability: 1 });
    expect(planted).toBe(0);
    expect(countCellsByState(grid, 'seed')).toBe(0);
  });

  it('não coloniza se a planta em bloom for de outra espécie (ex: pteridófita)', () => {
    setCell(grid, { row: 2, col: 2 }, { estado: 'bloom', tipoPlanta: 'pteridophyte', idade: 1 });

    const planted = spreadBryophytes(grid, { spreadProbability: 1 });
    expect(planted).toBe(0);
    expect(countCellsByState(grid, 'seed')).toBe(0);
  });

  it('não planta sobre células vizinhas ocupadas quando todos os vizinhos estão tomados', () => {
    setCell(grid, { row: 2, col: 2 }, { estado: 'bloom', tipoPlanta: 'bryophyte', idade: 1 });

    // Ocupa todos os vizinhos
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        setCell(grid, { row: 2 + dy, col: 2 + dx }, { estado: 'mature', idade: 5 });
      }
    }

    const planted = spreadBryophytes(grid, { spreadProbability: 1 });
    expect(planted).toBe(0);
    expect(countCellsByState(grid, 'seed')).toBe(0);
  });
});
