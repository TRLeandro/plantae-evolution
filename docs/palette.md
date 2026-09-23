# Paleta de Cores e Design System — Plantae Evolution 🌱

Este documento descreve as diretrizes de cores, tokens e decisões visuais do projeto **Plantae Evolution**, desenhadas para garantir legibilidade, contraste e atmosfera temática de bio-regeneração ecológica.

---

## 1. Estrutura de Cores

### 1.1 Interface (UI Foundation)
A interface adota uma base escura (*Deep Biosphere*), permitindo que a matriz de células e os agentes polinizadores tenham protagonismo visual na tela.

| Variável CSS | Token Tailwind | HEX | Finalidade |
|---|---|---|---|
| `--background` | `bg-background` | `#0B130E` | Fundo geral da aplicação |
| `--foreground` | `text-foreground` | `#F2FBF5` | Texto principal de alto contraste |
| `--surface-panel` | `bg-surface-panel` | `#132219` | Painéis laterais (Configurações e Impacto) |
| `--surface-card` | `bg-surface-card` | `#1C3225` | Cards internos, inputs e botões |
| `--surface-hover` | `hover:bg-surface-hover` | `#244030` | Feedback de hover |
| `--border-subtle` | `border-border-subtle` | `#284B37` | Bordas e divisores discretos |
| `--border-active` | `border-border-active` | `#4ADE80` | Foco e seleção de espécie |
| `--text-muted` | `text-text-muted` | `#94A89C` | Rótulos secundários e unidades de medida |

---

### 1.2 Matriz e Terreno (Canvas p5.js)
No canvas do autômato celular, o solo deve ser neutro e acolhedor, destacando a evolução biológica:

| Token / Propriedade | HEX | RGB (para `p5.fill()`) | Uso |
|---|---|---|---|
| `grid.empty` | `#151E17` | `21, 30, 23` | Célula vazia (solo fértil) |
| `grid.lines` | `#1C2920` | `28, 41, 32` | Linhas da matriz |
| `grid.hover` | `#223829` | `34, 56, 41` | Célula sob o cursor do mouse |

---

### 1.3 Ciclo Ontogenético da Planta
Conforme a planta se desenvolve em ticks lógicos (Sprints 1 e 2):

| Estágio | HEX | RGB | Descrição Visual |
|---|---|---|---|
| **Semente (`seed`)** | `#D4A373` | `212, 163, 115` | Âmbar terroso, ponto inicial de plantio |
| **Broto (`sprout`)** | `#86EFAC` | `134, 239, 172` | Verde claro enérgico, fase de crescimento rápido |
| **Madura (`mature`)** | `#16A34A` | `22, 163, 74` | Verde esmeralda vivo, gerando $O_2$ e absorvendo $CO_2$ |
| **Reprodução (`bloom`)** | `#FB7185` | `251, 113, 133` | Coral floral, pronta para polinização |

---

### 1.4 Diferenciação de Espécies (Fase 2)
Quando múltiplas espécies coexistirem na simulação:

| Espécie | Fase Madura | Fase Reprodutiva | Agente Principal |
|---|---|---|---|
| **Briófita** (Musgos) | `#15803D` *(Verde Floresta)* | `#BEF264` *(Esporo Lima)* | Vento 🍃 |
| **Gimnosperma** (Arbusto/Pinho) | `#0D9488` *(Teal)* | `#FBBF24` *(Pinha Âmbar)* | Pássaro 🐦 |
| **Angiosperma** (Flora) | `#059669` *(Esmeralda)* | `#F43F5E` *(Magenta)* | Abelha 🐝 |

---

### 1.5 Agentes Polinizadores
Agentes que se movem pelo canvas e precisam de alto contraste sobre o verde e o solo escuro:

| Agente | Emoji | HEX | RGB | Função |
|---|---|---|---|---|
| **Vento** | 🍃 | `#67E8F9` | `103, 232, 249` | Dispersão difusa / etérea |
| **Abelha** | 🐝 | `#FACC15` | `250, 204, 21` | Polinização de curto alcance |
| **Pássaro** | 🐦 | `#FB923C` | `251, 146, 60` | Dispersão de frutos de longo alcance |

---

### 1.6 Painel de Impacto Ambiental
Para o painel lateral direito de métricas acumuladas:

| Indicador | HEX | Significado |
|---|---|---|
| **$O_2$ Gerado** | `#38BDF8` | Oxigênio gerado, atmosfera limpa e pura |
| **$CO_2$ Capturado** | `#34D399` | Carbono capturado pela fotossíntese |
| **Aquecimento Crítico** | `#EF4444` | Alerta de alta temperatura planetária |
| **Aquecimento Regenerado** | `#10B981` | Equilíbrio térmico recuperado |

---

## 2. Como Utilizar no Código

### No React com Tailwind CSS:
```tsx
<aside className="bg-surface-panel border-r border-border-subtle p-4">
  <div className="bg-surface-card border border-border-subtle hover:border-border-active p-3 rounded-lg">
    <h3 className="text-foreground font-semibold">Geração de O₂</h3>
    <span className="text-metric-o2 text-2xl font-bold">+1.240 kg</span>
  </div>
</aside>
```

### No Canvas p5.js com `lib/colors.ts`:
```typescript
import { PALETTE, hexToRgb } from '@/lib/colors';

// Desenhando uma célula madura
p5.fill(...hexToRgb(PALETTE.stages.mature));
p5.rect(x, y, cellSize, cellSize);

// Desenhando o agente Abelha
p5.fill(...hexToRgb(PALETTE.agents.bee.color));
p5.circle(agentX, agentY, 8);
```
