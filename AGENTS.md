<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Plantae Evolution 🌱

Guia de contexto, arquitetura, regras de domínio e convenções técnicas para agentes de IA atuando no repositório **Plantae Evolution**.

---

## 1. Visão Geral do Projeto

**Plantae Evolution** é uma aplicação web baseada em um **autômato celular** interativo que simula o ciclo de vida, crescimento e dispersão biológica de espécies vegetais em um ecossistema planetário. A simulação enfatiza a polinização por agentes bióticos e abióticos (vento, abelhas, pássaros) e quantifica o impacto ambiental positivo da vegetação no combate ao aquecimento global (produção de $O_2$ e sequestro de $CO_2$).

---

## 2. Stack Técnica & Tecnologias

- **Framework:** Next.js (App Router, v16+) com React 19.
- **Linguagem:** TypeScript (modo estrito).
- **Estilização & UI:** Tailwind CSS v4 (configurado via `@import "tailwindcss";` e `@theme inline` em `app/globals.css`).
- **Motor Gráfico da Simulação:** **Canvas 2D nativo** em `components/SimulationCanvas.tsx`, com loop próprio via `requestAnimationFrame` dentro de `useEffect` (só no cliente). O motor da bacia é `lib/engine.ts` (`SimulationEngine`).
  - **p5.js não é usado na página.** `lib/sketch.ts` e `lib/colors.ts` são o motor p5 antigo e só existem porque `lib/__tests__/sketch.test.ts` depende deles. Não delete nem renomeie chaves; apenas mantenha os valores hex sincronizados.
- **Fontes:** IBM Plex Sans (texto, botões, números) e IBM Plex Sans Condensed (só legenda e rótulos do mapa), via `next/font/google` em `app/layout.tsx`.
- **Design Tokens:** definidos em `app/globals.css` (`:root` + `@theme inline`). As cores do mapa ficam em `lib/constants.ts` (`CELL_COLORS`, `AGENT_COLOR`, `AGENT_SEED_COLOR`, `UI_COLORS`) e espelhadas em `--map-*`. Contrato visual completo em **`DESIGN.md`**.

---

## 3. Arquitetura da Aplicação & Sincronização

### 3.1 Layout (`app/page.tsx`)
Um contêiner centralizado de até 1400px (`mx-auto max-w-[1400px]`) com duas áreas de cor lado a lado; a partir de `lg`, grid `[minmax(0,48rem) | minmax(22rem,1fr)]` (em tela larga quem cresce é a sálvia). O conteúdo fica sempre no contêiner; só o fundo da sálvia se estende até a borda direita da janela (`::after` no `<aside>`). No mobile as áreas empilham nessa ordem:

1. **Área de névoa** (protagonista, até `48rem`):
   - Título e duas frases de abertura.
   - `SeasonIndicator`: estação, efeito dela no rio, barra de progresso. Recebe `PlaybackControls` (Pausar/Continuar, Avançar 1 tick, Reiniciar) via prop `actions`.
   - `BrushPicker`: os 7 pincéis, **logo acima do mapa** em qualquer largura.
   - `MapFrame`: moldura de carta em volta do `SimulationCanvas`, com marcas de linha/coluna na margem, barra de escala, barra de inspeção e a legenda (8 itens).
   - Uma linha com o tamanho da grade, como a escala de uma carta.
2. **Área de sálvia** (apoio): `StatsCard` (4 números), `ScenarioPicker` (4 cenários), `SimulationSettings` (quadros por tick, alcance da água, polinizadores) e "Como funciona" (2 itens).

`BrushPicker`, `PlaybackControls`, `ScenarioPicker` e `SimulationSettings` são exports nomeados de `components/ControlBar.tsx`. A ilustração de dentro das células (árvore, broto, semente, água, terra, polinizador) fica em `components/cellArt.ts` e é usada tanto pelo canvas quanto por `components/MapSymbol.tsx` (legenda, pincéis, inspeção). Regras e limites dessa ilustração em `DESIGN.md` › "Dentro da célula do mapa". Não existem `ConfigPanel` nem `ImpactPanel`.

### 3.2 Gerenciamento de Estado
- O estado de controle e métricas reside primariamente no componente pai (`app/page.tsx`) e é propagado via `props` para os painéis.
- **Regra Crítica de Performance (Canvas ↔ React):**
  - O loop de `requestAnimationFrame` em `SimulationCanvas.tsx` executa a ~60 FPS e **NÃO** deve disparar `setState` do React a cada frame.
  - As métricas da bacia (`SimulationMetrics`) ficam no `SimulationEngine` e são enviadas ao React com *throttle* (a cada 15 quadros visuais, ~4 vezes por segundo) via `onMetricsUpdate`.
  - Props do React (pincel, velocidade, raio da água, callbacks) chegam ao loop por `useRef`, para não recriar o motor.
  - *Nota histórica:* os dois itens abaixo descrevem o motor p5 antigo (`lib/sketch.ts`), mantido só por causa dos testes.
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
3. **Madura (`mature`):** Planta plenamente desenvolvida. Realiza fotossíntese, gerando $O_2$ e capturando $CO_2$ a cada tick. Após `TICKS_MATURE_TO_BLOOM = 20` ticks (~5 segundos a ~4 ticks/s), entra em florescência/reprodução (`bloom`). **Ciclo infinito:** plantas maduras não morrem, alternando ciclicamente entre maturidade e florescência.
4. **Reprodução / Florescência (`bloom`):** Alternância cíclica da planta madura com duração de `TICKS_BLOOM_DURATION = 8` ticks (~2 segundos a ~4 ticks/s). Disponibiliza pólen, sementes ou esporos para os agentes polinizadores dispersarem; ao término do período, retorna ao estado `mature`.

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
  - **População Padrão:** `DEFAULT_WIND_AGENT_COUNT = 6`, provendo partículas ativas navegando fluidamente a ~60 FPS sobre a grade.
  - **Renderização Visual (`lib/sketch.ts`):** Partículas translúcidas ciano etéreo com halo difuso e cauda direcional calculada pelo vetor de velocidade.
  - **Motor de Dispersão (`lib/pollination.ts`):** Executa `tryWindDispersal()` a cada tick lógico (~4 ticks/s) no loop do sketch. Ao sobrevoar uma planta em `mature` ou `bloom`, tenta disseminar semente herdando a espécie para uma célula vizinha (vizinhança de Moore).
- **Abelha 🐝 (`#FACC15`):** Movimentação focada, visita flores e dispersa pólen para células **adjacentes** (curto alcance).
- **Pássaro 🐦 (`#FB923C`):** Movimentação rápida e ampla, transporta frutos e sementes para células **distantes** na matriz (longo alcance).

### 4.6 Regras de Colisão e Propagação (Implementadas em `lib/pollination.ts`)
Quando um agente tenta disseminar uma espécie para uma célula-alvo:
1. **Célula Vazia (`empty`):** Propagação bem-sucedida! Célula torna-se `seed` herdando `tipoPlanta` da célula-mãe.
2. **Célula em Reprodução (`bloom`):** Sucesso silencioso (interação polinizadora concluída; agente encerra ação ali sem plantar nova semente).
3. **Célula Ocupada em Crescimento (`seed`, `sprout` ou `mature`):** Bloqueio real. O agente tenta até mais 2 células vizinhas/no alcance (`MAX_DISPERSAL_RETRIES = 3`).
4. **3 Tentativas Falhas consecutivas:** Nenhuma propagação ocorre no tick atual; o agente continua seu percurso normal.

---

## 5. Design e Tokens Visuais

**A fonte de verdade é `DESIGN.md`** (direção, tokens, tipografia, espaçamento, copy e o que nunca fazer). Detalhe de cada cor, com contraste e luminosidade, em `docs/palette.md`.

Resumo: carta hidrográfica com as cores do próprio bioma. **Regra de hierarquia: nada da interface é mais saturado que o mapa.** O botão selecionado é fundo de tinta com texto claro; o foco de teclado é um contorno externo em tinta.

Dois regimes: **dentro da célula do mapa** a ilustração pode ter volume, vários tons e degradê sutil (com 4 limites: leitura do estado por luminosidade, tamanho real, determinismo por coordenada, custo); **na interface** tudo é chapado, sem degradê, sombra ou brilho.

| Papel | Token CSS | Classe Tailwind | HEX |
|---|---|---|---|
| Fundo da página (névoa) | `--mist` | `bg-mist` | `#E8EDE4` |
| Coluna de apoio (sálvia) | `--sage` | `bg-sage` | `#D8E0D2` |
| Moldura do mapa, botões | `--frame` | `bg-frame` | `#F3F6EF` |
| Tinta (texto, selecionado) | `--ink` | `text-ink` / `bg-ink` | `#17261F` |
| Texto secundário | `--ink-muted` | `text-ink-muted` | `#4A5A4F` |
| Linha fina | `--line` | `border-line` | `#A9B5A2` |
| Borda de controle | `--control-border` | `border-control-border` | `#6B7A6E` |

Cores de dado em texto: `text-water-text`, `text-soil-text`, `text-tree-text`, `text-rust-text` (versões escurecidas das cores do mapa, AA sobre sálvia).

Cores do mapa: `CELL_COLORS` em `lib/constants.ts` = `--map-*` em `app/globals.css`. Alterou uma, altere a outra (e o valor equivalente em `lib/colors.ts`).

---

## 6. Roadmap de Desenvolvimento (Sprints)

O projeto é dividido em **Fase 1 (MVP)** e **Fase 2 (Incrementos)**:

- **Fase 1: MVP do Autômato Funcional**
  - **Sprint 0 (Concluído):** Setup Next.js + Tailwind + integração do p5.js em modo instância com grid clicável, detecção precisa de coordenadas (linha, coluna) e sem erros de SSR.
  - **Sprint 1 (Concluído / Marco Fundamental):** Motor do MVP com espécie única + 1 agente polinizador (Vento) + ticks lógicos + ciclo de vida da planta + plantio por clique. [Concluídos: ontogenia vegetal, alternância reprodutiva `mature ↔ bloom`, motor de ticks desacoplado, plantio manual por clique/toque, cinemática da brisa, e dispersão abiótica autônoma de sementes com regras de colisão e retries via `lib/pollination.ts`].
- **Fase 2: Incrementos & Refinamento**
  - **Sprint 2:** Múltiplas espécies (Briófita, Gimnosperma, Angiosperma) e painel seletor.
  - **Sprint 3:** Agentes polinizadores bióticos completos (Abelha, Pássaro) e especialização por espécie.
  - **Sprint 4:** Painel de Impacto Ambiental (O2/CO2) com sincronização throttled estável.
  - **Sprint 5:** Interface completa de 3 colunas responsiva (desktop minimizável / mobile com tabs).
  - **Sprint 6:** Controles de simulação (Pause/Restart) e exportação de Card PNG do resultado.
  - **Sprint 7:** Balanceamento de ritmo ecológico e otimização a 60 FPS com grid denso.
  - **Sprint 8 (Opcional):** Persistência em `localStorage`, termômetro de aquecimento global e SFX.

---

## 7. Diretrizes para Agentes de Código

Ao desenvolver ou refatorar código neste repositório:
1. **Preserve a separação motor ↔ React:** A lógica do grid e dos agentes fica em `lib/` (`engine.ts` e módulos puros); `SimulationCanvas.tsx` só desenha e repassa eventos.
2. **Evite conflitos de SSR:** Qualquer uso de `window`, `document` ou do contexto do canvas acontece só no cliente (`useEffect` em componentes `'use client'`).
3. **Respeite o `DESIGN.md`:** Use os tokens de `app/globals.css` e as cores de `lib/constants.ts`. Nada de emoji como ícone, caixa alta com tracking, gradiente, card em volta de tudo ou texto abaixo de 13px. Nunca invente cores fora da paleta sem justificativa explícita.
4. **Código em TypeScript:** Tipar explicitamente as entidades da simulação (`Cell`, `TickState`, `Agent`, `SpeciesConfig`, `SimulationMetrics`).
5. **Progressão Gradual pelas Sprints:** Não introduza complexidade da Fase 2 antes de consolidar os critérios de aceite do MVP (Sprint 0 e Sprint 1).
