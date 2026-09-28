# DESIGN.md — Plantae Evolution

Contrato visual da interface. Qualquer mudança de UI parte daqui. Se precisar de um token que não existe, acrescente aqui primeiro; não crie valor avulso no componente.

## Direção

**Carta hidrográfica com as cores do próprio bioma.** A página é uma folha de mapa: o mapa da simulação fica numa moldura com marcas de linha e coluna na margem, escala e legenda, como numa carta impressa. As superfícies da interface vêm das cores do mapa (névoa esverdeada, sálvia, verde-escuro de tinta), não de papel neutro.

**Dois regimes, com regras diferentes:**

- **Dentro da célula do mapa = ilustração.** Volume, vários tons, degradê sutil e detalhe são permitidos (ver "Dentro da célula do mapa").
- **Todo o resto = cromo.** Botões, molduras, cabeçalhos, painéis, barras, legenda (o texto e o layout dela) e marcas da margem são chapados: sem degradê, sombra, brilho ou volume.

**Regra de hierarquia:** nada da interface é mais saturado que o mapa. O mapa é o elemento mais colorido da página; botões, rótulos, molduras e o estado selecionado ficam abaixo dele: tinta, névoa e sálvia.

Público: banca avaliando um trabalho acadêmico e curiosos. Legibilidade vem antes de estilo.

## Layout

Um contêiner centralizado de **até 1400px** (`mx-auto max-w-[1400px]`) com as duas áreas de cor lado a lado dentro dele:

```
      ┌──────────────── contêiner centralizado, até 1400px ────────────────┐
névoa │ névoa (até 48rem)                    │ sálvia (o resto, mín. 22rem) │ sálvia
 ...  │ Título + 2 frases                    │ Como está a bacia (4)        │ ...
      │ Estação ...... [Pausar][+1][Reinic.] │ Cenário                      │
      │ Pincel [7 botões]                    │ Ajustes (3 sliders)          │
      │ ┏━━━━━━━ moldura ━━━━━━━┓            │ Como funciona (2)            │
      │ ┃   1   5   10 ... 30   ┃            │                              │
      │ ┃ 1 ┌───────────────┐   ┃            │                              │
      │ ┃ 5 │     mapa      │   ┃            │                              │
      │ ┃   └───────────────┘   ┃            │                              │
      │ ┃   escala, inspeção,   ┃            │                              │
      │ ┃   legenda             ┃            │                              │
      │ ┗━━━━━━━━━━━━━━━━━━━━━━━┛            │                              │
      └──────────────────────────────────────┴──────────────────────────────┘
```

- A partir de `lg`: grid `[minmax(0,48rem) | minmax(22rem,1fr)]`. A névoa nunca passa de 48rem (o canvas fica com exatamente 640px); **quem cresce em tela larga é a sálvia**, para não abrir vazio dentro da névoa.
- O **conteúdo** fica sempre no contêiner. Só o **fundo** sangra: a névoa vem do `body`; a sálvia se estende até a borda direita da janela por um `::after` no `<aside>` (o wrapper externo tem `overflow-x: clip`).
- Critério verificado: em nenhuma largura existe faixa sem conteúdo maior que a coluna de sálvia. Medido: 1280 → 32px, 1440 → 52px, 1920 → 292px, 2560 → 612px, com a sálvia em 512–632px.
- No mobile: tudo empilha (névoa, depois sálvia). A moldura encosta nas bordas da tela para o mapa ganhar largura; o texto dentro dela mantém 16px de margem.
- Pincéis ficam sempre logo acima do mapa: pintar é a interação principal.

## Cores

Fonte de verdade: `app/globals.css`. Espelhos: `lib/constants.ts` (`CELL_COLORS`, `AGENT_*`, `UI_COLORS`), `components/cellArt.ts` (tons da ilustração), `components/SimulationCanvas.tsx` (`MAP_SYMBOL`: grade e hover) e `lib/colors.ts` (motor p5 legado, só para testes). Contraste e luminosidade em `docs/palette.md`.

### Interface

| Token | HEX | Uso |
|---|---|---|
| `mist` | `#E8EDE4` | Fundo da página (névoa esverdeada) |
| `sage` | `#D8E0D2` | Coluna de apoio; hover de botão |
| `frame` | `#F3F6EF` | Fundo da moldura do mapa e dos botões |
| `ink` | `#17261F` | Texto, moldura, marcas, **botão selecionado**, foco |
| `ink-muted` | `#4A5A4F` | Texto secundário |
| `line` | `#A9B5A2` | Linhas finas decorativas, trilhos de barra |
| `control-border` | `#6B7A6E` | Borda de botão (≥ 3:1) |

### Cores de dado em texto

Versões escurecidas das cores do mapa, para passar de 4.5:1 também sobre a sálvia. As do mapa (`map-*`) só em áreas preenchidas, nunca em texto.

| Token | HEX | Uso |
|---|---|---|
| `water-text` | `#155A73` | "Estação chuvosa" |
| `soil-text` | `#6F4820` | "Estiagem", número em atenção (35–70%) |
| `tree-text` | `#2F5D3A` | Número bom (> 70%), "Protegido" |
| `rust-text` | `#9A3A24` | Número crítico (≤ 35%), "Pode secar" |

## Dentro da célula do mapa (ilustração)

Código: `components/cellArt.ts`. É o **único** lugar do projeto onde volume e degradê são permitidos.

**Permitido:** vários tons por elemento, luz e sombra, volume; degradê sutil quando ajuda a ler a forma (copa, semente, corpo do polinizador); detalhe como tronco, galho, folha, asa, rastro curto; variação entre células vizinhas.

**Proibido mesmo aqui:** contorno branco ou neon; brilho tipo "glow"; sombra projetada exagerada (a sombra de chão é de 1–1.5px, tinta a 28%); qualquer coisa que tire a leitura do estado.

**Os 4 limites que o capricho não pode furar:**

1. **Leitura do estado.** O fundo chapado do estado (`CELL_COLORS`) é pintado primeiro e a ilustração vai por cima, sem substituí-lo. Cada estado continua distinguível dos vizinhos **pela luminosidade média da célula**, medida nos pixels reais do canvas (ver `docs/palette.md`).
2. **Tamanho real.** A célula tem 20px no desktop e ~11px no mobile. Abaixo de `DETAIL_THRESHOLD_PX = 14` px por célula na tela, usa-se o desenho `simple` (formas maiores, menos tons, sem asas nem pintas). O nível é decidido a cada quadro pela largura real do canvas.
3. **Determinismo.** 4 variantes por estado, escolhidas por `cellVariant(col, row)` (hash da coordenada). Nada de `Math.random()` no desenho: a mesma célula desenha igual em todo quadro.
4. **Custo.** As variantes são pré-renderizadas uma vez num atlas (`getCellAtlas`). Uma camada offscreen (`updateCellLayer`) só redesenha as células que mudaram de estado; o quadro faz um único `drawImage` da camada, mais grade, hover e polinizadores. Medido com CPU desacelerada (headless Chrome, três execuções): 4× → 49–52 fps (antes 46), 8× → 33–40 fps (antes 25); sem desaceleração, 60 fps antes e depois.

| Estado | Fundo | L\* do fundo | Ilustração (completo) |
|---|---|---|---|
| Árvore adulta | `#2F5D3A` | 35 | 1 a 3 copas com degradê radial (luz em cima à esquerda), sombra curta de chão; tronco em uma das variantes |
| Rio com água | `#1B6E8C` | 43 | mancha mais funda `#17637E` + duas ondulações curtas `#7FB3C4` |
| Terra úmida | `#9C6934` | 49 | quatro pintas de terra, claras e escuras |
| Semente | `#AA7644` (terra revolvida) | 54 | semente em gota com degradê, sulco e sombra curta; ângulo e posição variam |
| Broto | `#6FA96B` | 64 | caule curvo, 2 ou 3 folhas em dois tons, montinho de terra |
| Rio seco | `#A7AE9F` | 70 | tracejado na cor do rio (convenção de rio intermitente) + cascalho |
| Terra seca | `#D6C49A` | 80 | pintas claras e escuras; rachadura fina numa variante |
| Polinizador | — | — | corpo com degradê e duas listras, cabeça em tinta, asas translúcidas batendo, rastro curto de dois pontos; semente carregada presa embaixo |

A água não ondula no tempo; o que se move é só o que é estado real (polinizadores voando, asas batendo).

### Legenda, pincéis e inspeção

`components/MapSymbol.tsx` chama as **mesmas funções** de `cellArt.ts` num canvas pequeno (variante 0, com `devicePixelRatio`), então é idêntico ao mapa por construção. Não existe versão simplificada em SVG.

Única diferença registrada: o símbolo segue a regra de tamanho do **próprio** tamanho. Na legenda (16px) ele sai no desenho completo, mesmo no mobile, onde o mapa usa o `simple`. "Só olhar" continua um quadrado tracejado em SVG, porque é cromo, não célula.

## Moldura do mapa (cromo)

- Borda de 2px em `ink` em volta da folha; linha de 1px em `ink` em volta do canvas.
- Marcas **só nas posições numeradas**: 1, 5, 10, 15, 20, 25, 30 nas colunas; 1, 5, 10, 15, 20 nas linhas. A numeração começa em 1 e é a mesma da barra de inspeção.
- Barra de escala com largura exata de 5 células.
- Dentro da moldura, abaixo do mapa: inspeção (uma linha) e legenda (um item por linha, duas colunas a partir de `sm`), em IBM Plex Sans Condensed.
- Grade: tinta a 12%. Célula sob o cursor: contorno de 2px em tinta + clareamento de 50%.

## Tipografia

- **IBM Plex Sans** para texto, botões e números (`tabular-nums`).
- **IBM Plex Sans Condensed** só na legenda e nas marcas da margem do mapa.
- **Mínimo de 13px**, nas duas famílias. `text-xs` foi redefinido para 13px.

| Classe | Tamanho | Uso |
|---|---|---|
| `text-2xl` | 28px | Título da página, números de "Como está a bacia" |
| `text-xl` | 22px | Nome da estação |
| `text-base` | 16px | Texto corrido, títulos de seção (`font-semibold`) |
| `text-sm` | 14px | Botões, rótulos, legenda, regras |
| `text-xs` | 13px | Marcas da margem, detalhe sob números, notas de slider |

Títulos em caixa normal, sem tracking.

## Espaçamento e forma

- Escala de 4px: `1, 2, 3, 4, 6, 8, 12`. Nada de `.5`.
- Névoa: `space-y-4` (peças ligadas ao mapa ficam juntas). Sálvia: `space-y-8`.
- Separação por área de cor e por linha fina `border-line`. Nenhum bloco em card; a única moldura é a do mapa.
- Botões: `rounded-sm`, borda de 1px, sem sombra.

## Botões

Ver `buttonBase`, `buttonIdle`, `buttonSelected` em `components/ControlBar.tsx`.

| Estado | Aparência |
|---|---|
| Padrão | Fundo `frame`, borda `control-border`, texto `ink` |
| Hover | Fundo `sage` |
| Pressionado | Desce 1px |
| Foco de teclado | Contorno de 2px em `ink`, afastado 2px |
| Selecionado (`aria-pressed`) | Fundo `ink`, texto `mist`, peso 500 |
| Selecionado + foco | Fundo de tinta + contorno externo |
| Desabilitado | Sem fundo, borda `line`, texto `ink-muted` |

## Copy

- Escreva como quem explica a um colega. Frases curtas, voz ativa.
- **A unidade de tempo da simulação é "tick"**, nunca "passo" nem "geração", na interface, no código e na documentação. É o termo do trabalho acadêmico e do código (`totalTicks`, `framesPerTick`, `lib/tick.ts`).
- Velocidade: **quadros por tick**, o parâmetro real do motor. Mostre a conta, não uma unidade inventada: "1 tick a cada 12 quadros … 60 ÷ 12 = 5 ticks por segundo". O slider não é invertido.
- Nomes dos estados, iguais em todo lugar: **Rio com água, Rio seco, Terra úmida, Terra seca, Semente, Broto, Árvore adulta, Polinizador.**
- Legenda: um item por linha, "Nome: o que importa". "Como funciona": no máximo 2 itens, sem repetir a legenda. Abertura: no máximo 2 frases.
- Termos técnicos só onde são o assunto: **mata ciliar, polinizador, estiagem, tick**. Fora da interface: "raio Chebyshev", "dossel", "blindar", "microclima", "inerte", LaTeX, nomes de tecnologia.
- Botões dizem o que fazem: "Pausar", "Continuar", "Avançar 1 tick", "Reiniciar".

## Nunca faça neste projeto

- **Na interface** (botões, molduras, cabeçalhos, painéis, barras, legenda, marcas): degradê, sombra, brilho, glassmorphism, `backdrop-blur` ou volume. **Essa proibição não vale para a ilustração dentro das células do mapa**, que tem regras próprias (acima).
- Dentro das células: contorno branco ou neon, glow, sombra projetada exagerada, `Math.random()` no desenho, ou detalhe que substitua o fundo do estado.
- Elemento de interface mais saturado que o mapa.
- Conteúdo fora do contêiner centralizado, ou uma coluna esticando em `1fr` com o conteúdo encostado num lado (abre vazio em tela larga).
- Emoji como ícone (botão, título, rótulo, status, `<title>`).
- Caixa alta com `tracking-wider`.
- Tudo em card. A moldura existe só em volta do mapa.
- Texto abaixo de 13px.
- "Passo" ou "geração" como unidade de tempo.
- Inverter um controle para esconder a unidade real.
- Fundo creme/papel neutro, ou tema escuro com acento verde-limão (os designs anteriores).
- Pílula de badge com ponto pulsando, eyebrow acima de título, numeração 01/02/03, fonte mono "técnica".
