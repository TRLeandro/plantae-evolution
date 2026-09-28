# Paleta de cores — Plantae Evolution

Detalhe das cores da interface e do mapa. As regras de uso (hierarquia, layout, tipografia, copy) estão em [`DESIGN.md`](../DESIGN.md).

> Designs anteriores, **não reintroduza**: tema escuro "Deep Biosphere" (`#0B130E` + `#4ADE80`) e tema de papel creme com grifo amarelo (`#F4F3EE` + `#F2D46B`).

A paleta sai do próprio mapa: a interface usa névoa, sálvia e o verde-escuro da mata como tinta. **Nenhuma cor de interface é mais saturada que o mapa.**

## Onde as cores vivem

| Arquivo | O que tem | Quem usa |
|---|---|---|
| `app/globals.css` | Todos os tokens (`:root`) e o mapeamento Tailwind (`@theme inline`) | Componentes React |
| `lib/constants.ts` | `CELL_COLORS` (fundo chapado de cada estado), `AGENT_COLOR`, `AGENT_SEED_COLOR`, `UI_COLORS` | Canvas, `MapSymbol` |
| `components/cellArt.ts` | `TONE`: tons da ilustração dentro das células (copa, folha, semente, água, cascalho, pintas, asas) | Canvas e `MapSymbol` (mesmo código) |
| `components/SimulationCanvas.tsx` | `MAP_SYMBOL`: grade e hover | Só o canvas |
| `lib/colors.ts` | `PALETTE` do motor p5 antigo | Só `lib/__tests__/sketch.test.ts` |

Ao mudar uma cor, atualize `globals.css` e `constants.ts` juntos; se houver equivalente em `lib/colors.ts`, atualize o hex lá (sem renomear chaves).

## Interface

Contraste de texto medido sobre névoa / sálvia / moldura.

| Token | HEX | Contraste | Uso |
|---|---|---|---|
| `--mist` | `#E8EDE4` | — | Fundo da página (L\*93) |
| `--sage` | `#D8E0D2` | — | Coluna de apoio (L\*88) |
| `--frame` | `#F3F6EF` | — | Moldura do mapa, botões (L\*96) |
| `--ink` | `#17261F` | 13.3 / 11.6 / 14.4 | Texto, moldura, selecionado |
| `--ink-muted` | `#4A5A4F` | 6.2 / 5.4 / 6.7 | Texto secundário |
| `--line` | `#A9B5A2` | — (decorativa) | Linhas finas |
| `--control-border` | `#6B7A6E` | 3.8 / 3.4 | Borda de botão (mínimo 3:1) |
| texto sobre selecionado | `#E8EDE4` sobre `#17261F` | 13.3 | Botão selecionado |

## Dado em texto

| Token | HEX | Contraste (névoa / sálvia / moldura) |
|---|---|---|
| `--water-text` | `#155A73` | 6.4 / 5.7 / 7.0 |
| `--soil-text` | `#6F4820` | 6.7 / 5.9 / 7.3 |
| `--tree-text` | `#2F5D3A` | 6.4 / 5.7 / 7.0 |
| `--rust-text` | `#9A3A24` | 5.9 / 5.2 / 6.4 |

As cores do mapa com o mesmo matiz (`#1B6E8C`, `#9C6934`, `#B4472F`) não passam de 4.5:1 sobre a sálvia; por isso existem estas versões para texto.

## Mapa

Ordenado por luminosidade. Todas abaixo da página (L\*93).

Duas medidas: o L\* do **fundo chapado** (`CELL_COLORS`) e o L\* **médio da célula já ilustrada**, medido nos pixels reais do canvas renderizado (cenário "Em recuperação", simulação pausada, média de todas as células de cada estado; a grade de 1px fica de fora). O limite 1 do `DESIGN.md` vale para a segunda coluna: cada estado precisa se separar dos vizinhos pela luminosidade média, não só pelo desenho.

| Estado | `CellState` | Token CSS | Fundo | L\* fundo | L\* médio 20px (completo) | L\* médio ~11px (simplificado) |
|---|---|---|---|---|---|---|
| Árvore adulta | `ARVORE_ADULTA` | `--map-tree` | `#2F5D3A` | 35 | 36 | 36 |
| Rio com água | `LEITO_AGUA` | `--map-water` | `#1B6E8C` | 43 | 44 | 46 |
| Terra úmida | `SOLO_FERTIL` | `--map-wet-soil` | `#9C6934` | 49 | 49 | 49 |
| Semente | `SEMENTE` | `--map-seed-ground` | `#AA7644` | 54 | 55 | 56 |
| Broto | `BROTO` | `--map-sprout` | `#6FA96B` | 64 | 60 | 62 |
| Rio seco | `LEITO_SECO` | `--map-dry-river` | `#A7AE9F` | 70 | 69 | 68 |
| Terra seca | `SOLO_SECO` | `--map-dry-soil` | `#D6C49A` | 80 | 80 | 80 |

Ajustes feitos por causa dessa medida:

- A terra úmida foi clareada de `#8A5A2B` para `#9C6934`: com o valor original ela tinha a mesma luminosidade da água (L\*43), e as duas se encostam em toda margem.
- A semente ganhou fundo próprio (`#AA7644`, "terra revolvida"). Com o fundo da terra úmida, a célula de semente ficava a 2 pontos de L\* dela e só o desenho a distinguia.
- No desenho simplificado, o broto usa folhas em tom médio e a semente é menor: com folhas escuras, broto e semente empatavam em L\*57 no mobile.

### Tons da ilustração (`TONE` em `components/cellArt.ts`)

| Elemento | Cores |
|---|---|
| Copa da árvore (degradê radial) | luz `#528C52` → corpo `#33653D` → sombra `#1F4228`; tronco `#4A3320` |
| Broto | caule `#3E6B35`; folhas `#35692F` e `#4A8A40` |
| Semente (degradê radial) | luz `#F3DDA6` → corpo `#E6C27A` → borda `#B98A3E`; sulco `#9C7432` |
| Água | fundo mais fundo `#17637E`; ondulações `#7FB3C4` |
| Rio seco | tracejado `#1B6E8C`; cascalho `#8E958A` e `#C3C8BC` |
| Terra úmida | pintas `#86592B` e `#AE7A42` |
| Terra seca | pintas e rachadura `#C2AE80`, `#E2D3AE` |
| Sombra de chão | `rgba(23, 38, 31, 0.28)`, deslocada 1–1.5px |
| Polinizador (degradê radial) | `#F2C457` → `#E0A526` → `#B97F10`; listras e cabeça `#17261F`; asas `rgba(232, 240, 236, 0.6)` com borda de tinta a 35%; rastro de tinta a 18% |
| Semente carregada | `#E6C27A` com borda `#B98A3E` |

### Grade e cursor (cromo, `MAP_SYMBOL` em `SimulationCanvas.tsx`)

| Elemento | Cor |
|---|---|
| Grade | `rgba(23, 38, 31, 0.12)` |
| Célula sob o cursor | contorno `#17261F` 2px + `rgba(243, 246, 239, 0.5)` |
| Seca crítica (barra da interface) | `#B4472F` |
