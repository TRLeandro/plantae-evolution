/**
 * Plantae Evolution — Paleta de Cores e Tokens Visuais
 *
 * Legado do motor p5 (lib/sketch.ts), usado só por lib/__tests__/sketch.test.ts.
 * O mapa real usa lib/constants.ts. Valores sincronizados com app/globals.css.
 */

export const PALETTE = {
  // Cores da Interface (UI)
  ui: {
    background: '#E8EDE4',       // Névoa (fundo da página)
    surfacePanel: '#D8E0D2',     // Sálvia (coluna de apoio)
    surfaceCard: '#F3F6EF',      // Moldura do mapa e botões
    surfaceHover: '#D8E0D2',     // Hover de botões
    borderSubtle: '#A9B5A2',     // Linhas finas
    borderActive: '#17261F',     // Selecionado e foco (tinta)
    textPrimary: '#17261F',      // Tinta
    textMuted: '#4A5A4F',        // Texto secundário
  },

  // Grid / Matriz da Simulação
  grid: {
    empty: '#9C6934',            // Terra úmida desocupada
    lines: '#A9B5A2',            // Linhas da grade
    hover: '#F3F6EF',            // Célula sob o cursor (clareada)
  },

  // Ciclo Ontogenético da Planta (Ciclo de Vida)
  stages: {
    seed: '#E6C27A',             // Semente (ponto ocre)
    sprout: '#6FA96B',           // Broto
    mature: '#2F5D3A',           // Planta adulta
    bloom: '#FB7185',            // Fase reprodutiva / florescência (coral)
  },

  // Bacia Hidrográfica e Mata Ciliar (TASK.md § Fase 3)
  watershed: {
    water: '#1B6E8C',            // LEITO_AGUA (rio com água)
    dryRiver: '#A7AE9F',         // LEITO_SECO (rio seco)
    fertileSoil: '#9C6934',      // SOLO_FERTIL (terra úmida)
    drySoil: '#D6C49A',          // SOLO_SECO (terra seca)
    seed: '#E6C27A',             // SEMENTE (ponto)
    sprout: '#6FA96B',           // BROTO
    tree: '#2F5D3A',             // ARVORE_ADULTA
    disperser: '#E0A526',        // DISPERSOR (polinizador)
  },

  // Identidade das Espécies (Fase 2 / Sprint 2)
  species: {
    bryophyte: {
      id: 'bryophyte',
      name: 'Briófita',
      mature: '#15803D',         // Verde floresta denso
      reproductive: '#BEF264',   // Esporo lima luminoso
      agent: 'wind',
    },
    gymnosperm: {
      id: 'gymnosperm',
      name: 'Gimnosperma',
      mature: '#0D9488',         // Conífera / Teal
      reproductive: '#FBBF24',   // Pinha / Semente dourada
      agent: 'bird',
    },
    angiosperm: {
      id: 'angiosperm',
      name: 'Angiosperma',
      mature: '#059669',         // Esmeralda vibrante
      reproductive: '#F43F5E',   // Flor / Fruto magenta vivo
      agent: 'bee',
    },
  },

  // Agentes Polinizadores
  agents: {
    wind: {
      id: 'wind',
      name: 'Vento',
      color: '#67E8F9',          // Ciano etéreo
      symbol: '🍃',
    },
    bee: {
      id: 'bee',
      name: 'Abelha',
      color: '#FACC15',          // Âmbar dourado vibrante
      symbol: '🐝',
    },
    bird: {
      id: 'bird',
      name: 'Pássaro',
      color: '#FB923C',          // Coral alado
      symbol: '🐦',
    },
  },

  // Métricas do Painel de Impacto Ambiental
  metrics: {
    o2: '#155A73',               // Oxigênio gerado
    co2: '#2F5D3A',              // Carbono capturado
    warmingHigh: '#9A3A24',      // Alerta crítico (ferrugem)
    warmingNeutral: '#6F4820',   // Estado intermediário
    warmingLow: '#2F5D3A',       // Equilibrado
  },
} as const;

export type SpeciesKey = keyof typeof PALETTE.species;
export type AgentKey = keyof typeof PALETTE.agents;
export type StageKey = keyof typeof PALETTE.stages;

/**
 * Utilitário para converter cor HEX para tupla RGB [r, g, b].
 * Útil para chamadas p5.js como `p5.fill(...hexToRgb(color))`.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}
