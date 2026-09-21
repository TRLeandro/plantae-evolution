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
- **Reiniciar**: botão que reseta a simulação por completo — grid, impacto acumulado e configuração voltam ao estado padrão
- **Finalizar**: botão que pede confirmação ao usuário antes de encerrar a simulação e gerar a imagem de resultado (ver seção "Export de finalização")

---

## Regras da Simulação

Cada espécie possui características próprias:

| Característica | Descrição |
|---|---|
| Tempo de crescimento | Cada espécie tem seu próprio tempo (em ticks/frames) para evoluir de semente → crescendo → madura. Plantas maduras passam pelo ciclo de reprodução, onde alternam entre o estado maduro e estado de propagação (gerar esporos/flores/frutos). **O ciclo é infinito**: uma vez madura, a planta nunca morre e permanece alternando entre maduro/propagação indefinidamente |
| Reprodução de plantas | Cada espécie se reproduz de maneira própia, briófitas e pteridófitas que se reproduzem por esporos, gimnospermas por sementes, e angiospermas por flores e frutos
| Agente polinizador | Cada espécie é associada a um tipo de agente polinizador responsável por sua propagação |

---

## Agentes polinizadores

Os agentes se movem pela matriz e determinam o alcance de propagação de cada espécie:

- **Vento 🍃**: espalham os esporos e sementes para diferentes casas
- **Abelhas** 🐝: espalham o pólen para as casas **adjacentes** até plantas maduras, que passam a produzir sementes/frutos (propagação de curto alcance)
- **Pássaros** 🐦: espalham sementes e frutos para casas **mais distantes** na matriz (propagação de longo alcance)

### Regra de colisão de propagação

Vale igualmente para os três agentes (vento, abelhas e pássaros). Quando um agente tenta propagar para uma célula da matriz:

1. **Célula vazia** → propagação ocorre normalmente, nova semente é plantada ali.
2. **Célula ocupada, planta em fase de reprodução** → tentativa é considerada resolvida (um "sucesso silencioso"): nada muda na célula, e o agente encerra a tentativa ali, sem gerar nova planta nem alterar o estado da célula-alvo.
3. **Célula ocupada, planta em fase de crescimento (semente/crescendo)** → bloqueio real. O agente tenta mais **2 células** alternativas dentro do seu alcance.
4. Se as 3 tentativas (original + 2 retries) falharem, o agente simplesmente não propaga nesse tick e continua se movendo normalmente pela matriz — sem penalidade ou efeito colateral.

---

## Impacto ambiental

- Cada célula com planta madura contribui para geração de **O2** e captura de **CO2**
- A simulação deve visualizar esse impacto de forma acumulada (ex: contador ou gráfico simples) conforme a vegetação se espalha pela matriz
- **Escopo atual**: é apenas um contador informativo/acumulado — sem gamificação, metas ou medidor de "aquecimento global" resolvido. Isso pode ser considerado em uma fase futura.

---

## Arquitetura da interface

A tela é dividida em 3 áreas:

| Área | Conteúdo |
|---|---|
| Menu lateral esquerdo | Configurações: seleção de espécie (1 a 3 tipos), slider de velocidade da simulação |
| Área central | Matriz interativa (o "jogo"): renderização da simulação e clique para plantio |
| Menu lateral direito | Impacto do planeta: totais acumulados de O2 gerado e CO2 capturado |

### Comportamento responsivo (Tailwind CSS)

- **Desktop**: os menus laterais (esquerdo e direito) são minimizáveis, permitindo que o grid da simulação ocupe mais espaço em tela quando o usuário quiser focar na visualização.
- **Mobile**: layout muda para uma **tab bar fixa na parte inferior** com 3 abas (Configuração / Grid / Impacto) — apenas um painel é visível por vez. A simulação **continua rodando em background** mesmo quando o usuário está com a aba de Configuração ou Impacto aberta (ou seja, o motor de simulação não pode depender da matriz estar montada/visível na tela para seguir avançando).

O layout base (desktop) é implementado com **CSS Grid** de 3 colunas na página principal, adaptado para as classes utilitárias do Tailwind:

```css
.container {
  display: grid;
  grid-template-columns: 260px 1fr 280px;
  height: 100vh;
}
```

### Gerenciamento de estado

As 3 áreas compartilham estado (configuração → simulação → impacto), então o estado vive no componente pai (`page.jsx`) e é passado como props para os 3 painéis — sem necessidade de Context API dado o tamanho atual do projeto:

```jsx
export default function Page() {
  const [config, setConfig] = useState({ especie: 'angiosperma', velocidade: 1 });
  const [impacto, setImpacto] = useState({ o2: 0, co2: 0 });

  return (
    <div className="container">
      <ConfigPanel config={config} onChange={setConfig} />
      <SimulationCanvas config={config} onImpactoChange={setImpacto} />
      <ImpactPanel impacto={impacto} />
    </div>
  );
}
```

---

## Export de finalização

Ao clicar em **Finalizar** (após confirmação), a simulação pausa e gera uma **imagem PNG única**, no estilo de card compartilhável para redes sociais (Instagram/X):

1. **Título** no topo (ex: nome do projeto ou frase de efeito)
2. **Screenshot do estado final do grid** logo abaixo
3. **Impacto gerado** na parte inferior — totais de O2 gerado e CO2 capturado

O layout visual detalhado desse card (tipografia, cores, composição) fica para uma fase futura — nesta etapa o objetivo é apenas ter a função de captura (grid + números) funcionando e exportável.

---

## Stack técnica

- **Framework**: Next.js
- **Estilização**: Tailwind CSS, com suporte a layout responsivo (menus minimizáveis no desktop, tab bar no mobile)
- **Motor de simulação**: p5.js, em **modo instância**, integrado via `react-p5-wrapper` (ou import dinâmico client-side) para evitar conflito com o SSR do Next.js
- **Estrutura de dados**:
  - Grid representado como matriz de objetos (`{ estado, tipoPlanta, idade }`)
  - Polinizadores representados como lista de agentes com posição e regra de movimento própria
- **Sincronização p5.js ↔ React**:
  - O `draw()` do p5 roda fora do ciclo de renderização do React (~60fps) — não deve disparar `setState` a cada frame
  - Os totais de O2/CO2 são acumulados internamente durante a simulação e sincronizados com o estado do React a cada N frames (ex: 1x por segundo), evitando re-renders excessivos do painel de impacto
  - A velocidade do jogo é controlada por um contador de ticks lógicos (quantos frames se passam entre cada avanço da simulação), não pelo `frameRate()` do p5

---
