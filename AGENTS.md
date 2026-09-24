<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Plantae Evolution 🌱

Guia de contexto, arquitetura, regras de domínio e convenções técnicas para agentes de IA atuando no repositório **Plantae Evolution**.

---

## 1. Visão Geral do Projeto

**Plantae Evolution** é uma aplicação web baseada em um **autômato celular** interativo que simula o ciclo de vida, crescimento e dispersão biológica de espécies vegetais em um ecossistema planetário. A simulação enfatiza a polinização por agentes bióticos e abióticos (vento, abelhas, pássaros) e quantifica o impacto ambiental positivo da vegetação no combate ao aquecimento global (geração de $O_2$ e sequestro de $CO_2$).

---

## 2. Stack Técnica & Tecnologias

- **Framework:** Next.js (App Router, v16+) com React 19.
- **Linguagem:** TypeScript (modo estrito).
- **Estilização & UI:** Tailwind CSS v4 (configurado via `@import "tailwindcss";` e `@theme inline` em `app/globals.css`).
- **Motor Gráfico da Simulação:** p5.js em **modo instância** (`new p5(sketch, containerRef)`), integrado via dynamic import client-side (`ssr: false`) ou `useEffect` para evitar falhas de SSR/hidratação.
- **Design Tokens:** Centralizados em `lib/colors.ts` (objeto `PALETTE` e função `hexToRgb()`) e espelhados em variáveis CSS / Tailwind em `app/globals.css`.

---

## 3. Arquitetura da Aplicação & Sincronização

### 3.1 Layout de 3 Painéis
A interface do usuário é estruturada em três áreas principais:
1. **Menu Lateral Esquerdo (`ConfigPanel`):** Seleção da espécie ativa (1 a 3 espécies), slider de velocidade (ticks lógicos), botões de controle (iniciar, pausar, reiniciar, finalizar).
2. **Área Central (`SimulationCanvas`):** Canvas interativo do autômato celular (renderização do solo, plantas, agentes voadores, partículas e clique para plantio).
3. **Menu Lateral Direito (`ImpactPanel`):** Métricas ecológicas planetárias (acumulado de $O_2$ gerado, $CO_2$ capturado e termômetro de regeneração climática).

### 3.2 Gerenciamento de Estado
- O estado de controle e métricas reside primariamente no componente pai (`app/page.tsx`) e é propagado via `props` para os painéis.
- **Regra Crítica de Performance (p5.js ↔ React):**
  - O loop gráfico `draw()` do p5.js executa a ~60 FPS e **NÃO** deve disparar `setState` do React a cada frame.
  - As métricas ecológicas ($O_2$ e $CO_2$) são acumuladas internamente no motor de simulação e sincronizadas com o React com *throttle* (ex: 1 vez por segundo ou a cada N ticks lógicos).
  - O controle de velocidade da simulação **NÃO** altera o `frameRate()` do p5. Em vez disso, altera o contador de **ticks lógicos** (quantidade de frames p5 decorridos entre cada atualização de estado da matriz), centralizado no módulo puro `lib/tick.ts` (`createTickState`, `advanceFrame`, `setSpeed`). A cada tick lógico disparado, o motor de ontogenia puro `lib/lifecycle.ts` (`advanceGrid`) avança o ciclo de vida das células. Enquanto isso, agentes atmosféricos como o Vento (`lib/wind.ts`) deslocam-se de forma contínua e suave a cada quadro visual (~60 FPS) sobre o grid.
  - **Comunicação de Eventos (p5 ↔ React):** Eventos de interação (como `p.mousePressed`) e parâmetros reativos (como velocidade de ticks) são integrados através de opções em `createSketch({ onCellClick, getFramesPerTick, windAgentCount })`. No componente React, esses callbacks e referências são estabilizados via `useRef` para garantir integridade sem reiniciar o ciclo de vida do sketch.

---

## 4. Modelo de Domínio da Simulação

### 4.1 Estrutura de Dados da Matriz (Grid)
O terreno é uma grade bidimensional (32 colunas × 24 linhas com células de 20px, totalizando canvas de 640×480px) centralizada em `lib/grid.ts` e com tipagens canônicas em `types/simulation.ts`. O mapeamento de coordenadas (pixel X, Y → col, row) é feito via `mouseToGridCoord()`. Cada célula possui o formato:
```typescript
interface Cell {
  estado: 'empty' | 'seed' | 'sprout' | 'mature' | 'bloom';
  tipoPlanta?: 'bryophyte' | 'gymnosperm' | 'angiosperm';
  idade: number; // Ticks de vida na fase atual
}
```

### 4.2 Sistema de Ticks Lógicos (Motor Temporal)
O ritmo de evolução do ecossistema é desacoplado da taxa de quadros gráficos (~60 FPS) através de um contador de quadros acumulador mantido em `lib/tick.ts` e tipado via `types/simulation.ts`:
```typescript
interface TickState {
  frameAccumulator: number;
  framesPerTick: number; // Padrão: 15 frames (~4 ticks/segundo a 60 FPS)
  totalTicks: number;
  running: boolean;
}
```
- **Acumulador & Disparo:** No loop `p.draw()`, `advanceFrame(tickState)` incrementa o acumulador a cada frame. Quando `frameAccumulator >= framesPerTick`, o acumulador é zerado, `totalTicks` é incrementado e o tick lógico é executado.
- **Velocidade Dinâmica:** Modificada via `setSpeed(tickState, framesPerTick)` sem redefinir o sketch ou zerar o acumulador.
- **Pausa / Retomada:** Controlada via `setRunning(tickState, boolean)`.

### 4.3 Ontogenia e Ciclo de Vida da Planta
O ciclo ontogenético é gerenciado pelo módulo puro `lib/lifecycle.ts` através das funções `advanceCell()` e `advanceGrid()`, que atualizam o estado das células in-place a cada tick lógico:
1. **Semente (`seed`):** Ponto inicial após o plantio (clique manual) ou dispersão de um polinizador. Permanece nesta fase por `TICKS_SEED_TO_SPROUT = 16` ticks (~4 segundos a ~4 ticks/s).
2. **Broto (`sprout`):** Fase de crescimento ativo. Permanece por `TICKS_SPROUT_TO_MATURE = 24` ticks (~6 segundos a ~4 ticks/s). O tempo total acumulado desde o plantio até a maturidade é de **~10 segundos** (40 ticks).
3. **Madura (`mature`):** Planta plenamente desenvolvida. Realiza fotossíntese, gerando $O_2$ e capturando $CO_2$ a cada tick. **Ciclo infinito:** plantas maduras não morrem, mantendo-se ativas e permanentes no ecossistema.
4. **Reprodução / Florescência (`bloom`):** Alternância cíclica da planta madura. Disponibiliza pólen, sementes ou esporos para os agentes polinizadores dispersarem.

### 4.4 Espécies de Plantas
| Espécie | Tipo de Reprodução | Fase Madura (Cor) | Fase Reprodutiva (Cor) | Agente Principal |
|---|---|---|---|---|
| **Briófita** (Musgos) | Esporos | `#15803D` (Verde Floresta) | `#BEF264` (Esporo Lima) | Vento 🍃 |
| **Gimnosperma** (Conífera/Pinho) | Sementes / Pinhas | `#0D9488` (Teal) | `#FBBF24` (Pinha Âmbar) | Pássaro 🐦 |
| **Angiosperma** (Flora com flor/fruto) | Flores e Frutos | `#059669` (Esmeralda) | `#F43F5E` (Magenta) | Abelha 🐝 |

### 4.5 Agentes Polinizadores & Dispersão
Agentes móveis que navegam pela matriz:
- **Vento 🍃 (`#67E8F9`):** Movimentação difusa/ondulatória, espalha esporos e sementes leves por alcance médio.
  - **Estrutura & Tipagem:** `WindAgent` em `types/simulation.ts` (posições contínuas em pixels `x, y`, vetor de velocidade `vx, vy`, `waveOffset`, `baseSpeed`, `angle`).
  - **Cinemática Pura (`lib/wind.ts`):** Modelo de "Brisa Ondulatória" combinando velocidade horizontal base (`WIND_BASE_SPEED = 0.8`), perturbação angular contínua/turbulência (`WIND_TURBULENCE_STRENGTH = 0.012`, limite `WIND_MAX_ANGLE = π/4`) e oscilação senoidal transversal vertical (`WIND_WAVE_AMPLITUDE = 0.7`, `WIND_WAVE_FREQUENCY = 0.035`).
  - **Comportamento Periódico & Limites:** *Wrap-around* com margem (`WIND_MARGIN = 20px`), reintroduzindo a partícula pela borda oposta com nova altitude e brisa refrescada.
  - **População Padrão:** `DEFAULT_WIND_AGENT_COUNT = 3`, provendo 2 a 3 partículas ativas navegando fluidamente a ~60 FPS sobre a grade.
  - **Renderização Visual (`lib/sketch.ts`):** Partículas translúcidas ciano etéreo com halo difuso e cauda direcional calculada pelo vetor de velocidade.
- **Abelha 🐝 (`#FACC15`):** Movimentação focada, visita flores e dispersa pólen para células **adjacentes** (curto alcance).
- **Pássaro 🐦 (`#FB923C`):** Movimentação rápida e ampla, transporta frutos e sementes para células **distantes** na matriz (longo alcance).

### 4.6 Regras de Colisão e Propagação (Sprint 3)
Quando um agente tenta disseminar uma espécie para uma célula-alvo:
1. **Célula Vazia (`empty`):** Propagação bem-sucedida! Célula torna-se `seed`.
2. **Célula em Reprodução (`bloom`):** Sucesso silencioso (interação polinizadora concluída; agente encerra ação ali).
3. **Célula Ocupada em Crescimento (`sprout` ou `mature`):** Bloqueio real. O agente tenta até mais 2 células vizinhas/no alcance.
4. **3 Tentativas Falhas consecutivas:** Nenhuma propagação ocorre no tick atual; o agente continua seu percurso normal.

---

## 5. Sistema de Cores e Tokens Visuais

Consulte sempre `lib/colors.ts` para o uso em TypeScript/p5.js e `app/globals.css` para classes Tailwind.

### 5.1 Tokens de UI (Base *Deep Biosphere*)
- Fundo Principal: `--background` / `#0B130E`
- Texto Principal: `--foreground` / `#F2FBF5`
- Painéis Laterais: `--surface-panel` / `#132219`
- Cards e Botões: `--surface-card` / `#1C3225`
- Hover de Cards: `--surface-hover` / `#244030`
- Borda Discreta: `--border-subtle` / `#284B37`
- Borda Ativa / Seleção: `--border-active` / `#4ADE80`
- Texto Muted: `--text-muted` / `#94A89C`

### 5.2 Tokens da Matriz & Renderização Gráfica
```typescript
import { PALETTE, hexToRgb } from '@/lib/colors';

// Célula vazia: PALETTE.grid.empty ('#151E17')
// Grade: PALETTE.grid.lines ('#1C2920')
// Hover do cursor: PALETTE.grid.hover ('#223829')

// Estágios da Planta:
// PALETTE.stages.seed ('#D4A373')
// PALETTE.stages.sprout ('#86EFAC')
// PALETTE.stages.mature ('#16A34A')
// PALETTE.stages.bloom ('#FB7185')

// Agentes Polinizadores:
// PALETTE.agents.wind.color ('#67E8F9')
// PALETTE.agents.bee.color ('#FACC15')
// PALETTE.agents.bird.color ('#FB923C')
```

### 5.3 Métricas Ambientais
- $O_2$ Gerado: `--metric-o2` / `#38BDF8`
- $CO_2$ Capturado: `--metric-co2` / `#34D399`
- Aquecimento Crítico: `--warming-high` / `#EF4444`
- Planeta Regenerado: `--warming-low` / `#10B981`

---

## 6. Roadmap de Desenvolvimento (Sprints)

O projeto é dividido em **Fase 1 (MVP)** e **Fase 2 (Incrementos)**:

- **Fase 1: MVP do Autômato Funcional**
  - **Sprint 0 (Concluído):** Setup Next.js + Tailwind + integração do p5.js em modo instância com grid clicável, detecção precisa de coordenadas (linha, coluna) e sem erros de SSR.
  - **Sprint 1 (Concluído / Marco Fundamental):** Motor do MVP com espécie única + 1 agente polinizador (Vento) + ticks lógicos + ciclo de vida da planta + plantio por clique. [Concluídos: ontogenia vegetal, permanência de maturidade, motor de ticks, plantio manual e cinemática/renderização autônoma do agente Vento sobre o grid].
- **Fase 2: Incrementos & Refinamento**
  - **Sprint 2:** Múltiplas espécies (Briófita, Gimnosperma, Angiosperma) e painel seletor.
  - **Sprint 3:** Agentes completos (Abelha, Pássaro) e regra de colisão com retries.
  - **Sprint 4:** Painel de Impacto Ambiental (O2/CO2) com sincronização throttled estável.
  - **Sprint 5:** Interface completa de 3 colunas responsiva (desktop minimizável / mobile com tabs).
  - **Sprint 6:** Controles de simulação (Pause/Restart) e exportação de Card PNG do resultado.
  - **Sprint 7:** Balanceamento de ritmo ecológico e otimização a 60 FPS com grid denso.
  - **Sprint 8 (Opcional):** Persistência em `localStorage`, termômetro de aquecimento global e SFX.

---

## 7. Diretrizes para Agentes de Código

Ao desenvolver ou refatorar código neste repositório:
1. **Preserve a separação p5 ↔ React:** Mantenha a lógica matemática do grid e dos agentes desacoplada da camada visual de componentes React.
2. **Evite conflitos de SSR:** Qualquer uso de `window`, `document` ou instâncias do `p5` deve acontecer exclusivamente no ciclo de vida do cliente (`useEffect` ou componentes com `'use client'` e carregamento dinâmico sem SSR).
3. **Respeite o Design System:** Utilize sempre as variáveis de cor e tokens de `lib/colors.ts` e `globals.css`. Nunca invente cores fora da paleta sem justificativa explícita.
4. **Código em TypeScript:** Tipar explicitamente as entidades da simulação (`Cell`, `TickState`, `Agent`, `SpeciesConfig`, `SimulationMetrics`).
5. **Progressão Gradual pelas Sprints:** Não introduza complexidade da Fase 2 antes de consolidar os critérios de aceite do MVP (Sprint 0 e Sprint 1).
