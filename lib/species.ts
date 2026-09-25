/**
 * Plantae Evolution — Catálogo de Espécies Vegetais
 *
 * Fonte única de verdade para atributos botânicos, ritmos ontogenéticos,
 * modo de reprodução e associação aos vetores de dispersão das espécies.
 *
 * Referência: AGENTS.md § 4.4 (Espécies de Plantas e Matriz de Dispersão)
 */

import type { PlantType, AgentKind, ReproductionType } from '@/types/simulation';
import { PALETTE } from '@/lib/colors';

/** Configuração completa de uma espécie vegetal */
export interface SpeciesConfig {
  /** Identificador canônico da espécie */
  id: PlantType;
  /** Nome legível em português */
  name: string;
  /** Descrição ecológica sucinta */
  description: string;
  /** Categoria canônica do tipo de reprodução */
  reproductionType: ReproductionType;
  /** Rótulo textual da estrutura reprodutiva */
  reproductionLabel: string;
  /** Lista de agentes polinizadores capazes de dispersar esta espécie */
  dispersalAgents: AgentKind[];
  /** Se a espécie propaga-se diretamente por autômato celular (sem agentes móveis) */
  isCellularAutomaton: boolean;

  /* ── Ritmo ontogenético (duração em ticks lógicos por fase) ── */
  ticksSeedToSprout: number;
  ticksSproutToMature: number;
  ticksMatureToBloom: number;
  ticksBloomDuration: number;

  /* ── Cores representativas em formato hexadecimal ── */
  colorMature: string;
  colorReproductive: string;
}

/**
 * Catálogo canônico indexado por PlantType.
 * Contém parâmetros ecológicos distintos para cada uma das 4 espécies.
 */
export const SPECIES_CATALOG: Record<PlantType, SpeciesConfig> = {
  bryophyte: {
    id: 'bryophyte',
    name: 'Briófita',
    description:
      'Plantas pioneiras avasculares (musgos). Propagação direta para casas vizinhas por autômato celular clássico, sem agentes móveis.',
    reproductionType: 'spore',
    reproductionLabel: 'Esporos',
    dispersalAgents: [],
    isCellularAutomaton: true,
    ticksSeedToSprout: 12,
    ticksSproutToMature: 18,
    ticksMatureToBloom: 16,
    ticksBloomDuration: 10,
    colorMature: PALETTE.species.bryophyte.mature,
    colorReproductive: PALETTE.species.bryophyte.reproductive,
  },
  pteridophyte: {
    id: 'pteridophyte',
    name: 'Pteridófita',
    description:
      'Plantas vasculares sem sementes (samambaias). Dispersão de esporos impulsionada exclusivamente pelo vento.',
    reproductionType: 'spore',
    reproductionLabel: 'Esporos / Soros',
    dispersalAgents: ['wind'],
    isCellularAutomaton: false,
    ticksSeedToSprout: 14,
    ticksSproutToMature: 20,
    ticksMatureToBloom: 18,
    ticksBloomDuration: 8,
    colorMature: PALETTE.species.pteridophyte.mature,
    colorReproductive: PALETTE.species.pteridophyte.reproductive,
  },
  gymnosperm: {
    id: 'gymnosperm',
    name: 'Gimnosperma',
    description:
      'Plantas vasculares com sementes nuas / coníferas. Dispersão de médio e longo alcance realizada por vento e pássaros.',
    reproductionType: 'seed',
    reproductionLabel: 'Sementes / Pinhas',
    dispersalAgents: ['wind', 'bird'],
    isCellularAutomaton: false,
    ticksSeedToSprout: 20,
    ticksSproutToMature: 30,
    ticksMatureToBloom: 24,
    ticksBloomDuration: 6,
    colorMature: PALETTE.species.gymnosperm.mature,
    colorReproductive: PALETTE.species.gymnosperm.reproductive,
  },
  angiosperm: {
    id: 'angiosperm',
    name: 'Angiosperma',
    description:
      'Plantas com flores e frutos. Dispersão universal suportada por todos os agentes: vento, pássaros e abelhas.',
    reproductionType: 'flower-fruit',
    reproductionLabel: 'Flores e Frutos',
    dispersalAgents: ['wind', 'bird', 'bee'],
    isCellularAutomaton: false,
    ticksSeedToSprout: 16,
    ticksSproutToMature: 24,
    ticksMatureToBloom: 20,
    ticksBloomDuration: 8,
    colorMature: PALETTE.species.angiosperm.mature,
    colorReproductive: PALETTE.species.angiosperm.reproductive,
  },
};

/** Lista de todas as espécies disponíveis para iteração na UI */
export const SPECIES_LIST: SpeciesConfig[] = Object.values(SPECIES_CATALOG);

/**
 * Retorna a configuração completa para a espécie informada.
 */
export function getSpeciesConfig(type: PlantType): SpeciesConfig {
  return SPECIES_CATALOG[type];
}

/**
 * Verifica se uma espécie vegetal pode ser dispersa pelo agente polinizador fornecido.
 */
export function canDisperseWithAgent(species: PlantType, agent: AgentKind): boolean {
  const config = SPECIES_CATALOG[species];
  return config ? config.dispersalAgents.includes(agent) : false;
}
