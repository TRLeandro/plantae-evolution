/**
 * Plantae Evolution — Constantes e Configurações Padrão
 *
 * Centraliza dimensões do grid, paleta de cores canônica definida no TASK.md
 * e os parâmetros padrão da simulação de bacia hidrográfica e mata ciliar.
 *
 * Referência: TASK.md § Fase 3 (Paleta de Cores) e § 4 (Roteiro Técnico)
 */

import { CellState, SimConfig } from './types';

// ---------------------------------------------------------------------------
// Dimensões do Canvas e Grid
// ---------------------------------------------------------------------------
export const CELL_SIZE = 20;
export const GRID_COLS = 32;
export const GRID_ROWS = 24;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE; // 640px
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE; // 480px

// ---------------------------------------------------------------------------
// Paleta Canônica (TASK.md § Fase 3)
// ---------------------------------------------------------------------------
// Paleta tirada do bioma. Escada de luminosidade (L*): árvore 35 · água 43 ·
// terra úmida 49 · semente 53 · broto 64 · rio seco 70 · terra seca 80; a página é 93,
// então o mapa nunca se confunde com o fundo. Espelhado em app/globals.css
// (--map-*). Ver DESIGN.md.
export const CELL_COLORS: Record<CellState, string> = {
  [CellState.LEITO_AGUA]: '#1B6E8C',      // Rio com água
  [CellState.LEITO_SECO]: '#A7AE9F',      // Rio seco (leito de cascalho)
  [CellState.SOLO_FERTIL]: '#9C6934',     // Terra úmida
  [CellState.SOLO_SECO]: '#D6C49A',       // Terra seca
  [CellState.SEMENTE]: '#AA7644',         // Semente: terra recém-revolvida (L*53) + semente
  [CellState.BROTO]: '#6FA96B',           // Broto
  [CellState.ARVORE_ADULTA]: '#2F5D3A',   // Árvore adulta
};

export const AGENT_COLOR = '#E0A526';      // Polinizador (âmbar, o ponto mais saturado do mapa)
export const AGENT_SEED_COLOR = '#E6C27A'; // Semente carregada pelo polinizador

// Cores de UI e Interface (espelha app/globals.css)
export const UI_COLORS = {
  background: '#E8EDE4',
  surfacePanel: '#D8E0D2',
  surfaceCard: '#F3F6EF',
  surfaceHover: '#D8E0D2',
  borderSubtle: '#A9B5A2',
  borderActive: '#17261F',
  textPrimary: '#17261F',
  textMuted: '#4A5A4F',
  rainAccent: '#155A73',
  dryAccent: '#6F4820',
  danger: '#9A3A24',
  success: '#2F5D3A',
};

// ---------------------------------------------------------------------------
// Configuração Padrão da Simulação
// ---------------------------------------------------------------------------
export const DEFAULT_SIM_CONFIG: SimConfig = {
  waterRadius: 2,                     // Raio Chebyshev hídrico padrão (2 células)
  seasonDurationTicks: 90,            // Ticks por estação (~15-20s em velocidade normal)
  evaporationProbabilityDry: 0.12,    // 12% chance por tick de secar se árvores < 3 na seca
  treesNeededForProtection: 3,        // >= 3 árvores adultas protegem o leito
  recoveryProbabilityRain: 0.20,      // 20% chance de leito seco adjacente recuperar água na chuva
  seedDecayCycles: 15,                // Semente morre após 15 ticks em solo seco
  seedToSproutTicks: 10,              // 10 ticks em solo fértil para brotar
  sproutToTreeTicks: 16,              // 16 ticks com água contínua para virar árvore adulta
  treeMortalityRate: 0.001,           // Senescência natural mínima (0.1% por tick)
  disperserCount: 10,                 // 10 agentes polinizadores
  disperserDropProbability: 0.06,     // 6% de chance por tick de soltar semente em solo
  framesPerTick: 12,                  // ~5 ticks/seg a 60 FPS
};
