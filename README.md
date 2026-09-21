# Plantae Evolution 🌱

## Objetivo
Este projeto consiste em um autômato celular que simulará a evolução e disseminação de plantas pelo planeta, permitindo ao usuário observar o crescimento, a reprodução via agentes polinizadores e o impacto ambiental da vegetação no combate ao aquecimento global.

---

## Como funciona?
- Escolha um quadrado da matriz para plantar uma semente
- Acompanhe o crescimento dela até a fase madura
- Veja os agentes polinizadores disseminarem a espécie por toda a matriz
- Visualize o impacto da geração de O2 e captura de CO2 para o combate ao aquecimento global

---

## Interação do usuário

O projeto contará com uma interface para que o usuário interaja com a simulação:

- **Seleção de espécie**: o usuário pode escolher entre 1 a 3 tipos de plantas antes de plantar uma semente
- **Plantio**: clique em uma célula da matriz para plantar a semente da espécie selecionada
- **Controle de velocidade**: um controle (slider) permite acelerar ou desacelerar a simulação, afetando a velocidade de crescimento e disseminação

---

## Regras da Simulação

Cada espécie possui características próprias:

| Característica | Descrição |
|---|---|
| Tempo de crescimento | Cada espécie tem seu próprio tempo (em ticks/frames) para evoluir de semente → crescendo → madura. Plantas maduras passam pelo ciclo de reprodução, onde alternam entre o estado maduro e estado de propagação (gerar esporos/flores/frutos) |
| Reprodução de plantas | Cada espécie se reproduz de maneira própia, briófitas e pteridófitas que se reproduzem por esporos, gimnospermas por sementes, e angiospermas por flores e frutos
| Agente polinizador | Cada espécie é associada a um tipo de agente polinizador responsável por sua propagação |

---

## Agentes polinizadores

Os agentes se movem pela matriz e determinam o alcance de propagação de cada espécie:

- **Vento 🍃**: espalham os esporos e sementes para diferentes casas
- **Abelhas** 🐝: espalham o pólen para as casas **adjacentes** até plantas maduras, que passam a produzir sementes/frutos (propagação de curto alcance)
- **Pássaros** 🐦: espalham sementes e frutos para casas **mais distantes** na matriz (propagação de longo alcance)


---

## Impacto ambiental

- Cada célula com planta madura contribui para geração de **O2** e captura de **CO2**
- A simulação deve visualizar esse impacto de forma acumulada (ex: contador ou gráfico simples) conforme a vegetação se espalha pela matriz

---

## Arquitetura da interface

A tela é dividida em 3 áreas, organizadas em colunas:

| Área | Conteúdo |
|---|---|
| Menu lateral esquerdo | Configurações: seleção de espécie (1 a 3 tipos), slider de velocidade da simulação |
| Área central | Matriz interativa (o "jogo"): renderização da simulação e clique para plantio |
| Menu lateral direito | Impacto do planeta: totais acumulados de O2 gerado e CO2 capturado |

### Gerenciamento de estado

As 3 áreas compartilham estado (configuração → simulação → impacto), então o estado vive no componente pai (`page.jsx`) e é passado como props para os 3 painéis — sem necessidade de Context API dado o tamanho atual do projeto

---

## Stack técnica

- **Framework**: Next.js
- **Motor de simulação**: p5.js, em **modo instância**, integrado via `react-p5-wrapper` (ou import dinâmico client-side) para evitar conflito com o SSR do Next.js
- **Estrutura de dados**:
  - Grid representado como matriz de objetos (`{ estado, tipoPlanta, idade }`)
  - Polinizadores representados como lista de agentes com posição e regra de movimento própria
- **Sincronização p5.js ↔ React**:
  - O `draw()` do p5 roda fora do ciclo de renderização do React (~60fps) — não deve disparar `setState` a cada frame
  - Os totais de O2/CO2 são acumulados internamente durante a simulação e sincronizados com o estado do React a cada N frames (ex: 1x por segundo), evitando re-renders excessivos do painel de impacto
  - A velocidade do jogo é controlada por um contador de ticks lógicos (quantos frames se passam entre cada avanço da simulação), não pelo `frameRate()` do p5

---
