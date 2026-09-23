# Plantae Evolution 🌱 — Roadmap de Desenvolvimento (Sprints)

> Baseado em `README.md`. Estruturado em duas fases: **Fase 1 (MVP)** com foco em ter o autômato funcional rodando com apenas 1 planta e 1 agente polinizador, seguido da **Fase 2 (Incrementos)** para expandir o ecossistema até o estado planejado.

---

# 🚀 FASE 1: MVP do Autômato Funcional
*Objetivo da fase: Obter a menor versão jogável e autônoma da simulação (1 planta + 1 agente), validando o ciclo completo de plantio, crescimento e propagação.*

---

## Sprint 0 — Setup & Integração Base

**Objetivo:** validar a integração p5.js ↔ Next.js com canvas interativo básico.

**Tarefas**
- [ ] Inicializar projeto Next.js + Tailwind CSS
- [ ] Integrar p5.js em **modo instância** via `react-p5-wrapper` (ou import dinâmico client-side)
- [ ] Renderizar grid estático no canvas
- [ ] Capturar clique em uma célula (identificar coordenadas da matriz)

**Critério de aceite:** p5 roda dentro do componente React sem erros de hidratação/SSR e exibe o grid clicável.

---

## Sprint 1 — Motor do MVP (Espécie Única + Agente Único)

**Objetivo:** ciclo completo de vida e propagação autônoma com a máxima simplicidade (1 espécie + 1 agente polinizador).

**Tarefas**
- [ ] **Estrutura de dados do grid:** matriz de células `{ estado, tipoPlanta, idade }`
- [ ] **Sistema de ticks lógicos:** controle de tempo desacoplado do `frameRate()` do p5
- [ ] **Ciclo de vida da planta única:** semente → crescendo → madura (ciclo infinito, não morre)
- [ ] **Agente polinizador único (ex: Vento 🍃):** estrutura de agente com posição e movimentação na matriz
- [ ] **Mecanismo de propagação e colisão simplificado:**
  - Planta madura gera oportunidade de reprodução
  - Agente propaga semente para célula vazia no seu alcance
  - Colisão básica: se célula ocupada, encerra tentativa ou tenta célula vizinha
- [ ] **Plantio manual:** clique no grid planta a semente inicial

**Critério de aceite do MVP:** usuário clica para plantar uma semente; a planta cresce até a maturidade; o agente polinizador se move pela matriz e propaga sementes; novas plantas nascem e se espalham de forma autônoma pela matriz.

---

# 🌿 FASE 2: Incrementos & Refinamento do Sistema

---

## Sprint 2 — Múltiplas Espécies

**Objetivo:** expandir de 1 para até 3 espécies com características e visual distintos.

**Tarefas**
- [ ] Modelagem de dados por espécie (tempo de crescimento, tipo de reprodução: esporo / semente / flor-fruto)
- [ ] Painel de seleção de espécie antes do plantio
- [ ] Renderização visual distinta por espécie no grid

**Critério de aceite:** o usuário pode alternar entre espécies antes de plantar e ver comportamentos visuais e tempos de crescimento distintos.

---

## Sprint 3 — Agentes Polinizadores Completos & Regra de Colisão Avançada

**Objetivo:** adicionar os agentes restantes e a regra completa de colisão e retries.

**Tarefas**
- [ ] Implementar agente **Abelha 🐝** (dispersão de curto alcance para esporos/sementes)
- [ ] Implementar agente **Pássaros 🐦** (dispersão de longo alcance para frutos)
- [ ] **Regra completa de colisão de propagação** (para os 3 agentes):
  - Célula vazia → propaga normalmente
  - Célula ocupada em reprodução → sucesso silencioso (agente encerra ali)
  - Célula ocupada em crescimento → bloqueio real, tenta mais 2 células
  - 3 tentativas falhas → sem propagação no tick, agente segue movimento

**Critério de aceite:** os 3 agentes coexistem na simulação com alcances distintos e comportamento determinístico de colisão.

---

## Sprint 4 — Impacto Ambiental (O2 & CO2)

**Objetivo:** conectar a simulação ao painel de impacto sem gargalo de performance.

**Tarefas**
- [ ] Acúmulo interno de O2 gerado e CO2 capturado por célula madura a cada tick
- [ ] Sincronização throttled com o estado React (ex: 1x/segundo)
- [ ] Contador informativo no painel de impacto

**Critério de aceite:** os totais sobem de forma estável e contínua, sem causar quedas de FPS no canvas.

---

## Sprint 5 — Interface Completa & Responsividade

**Objetivo:** layout final de 3 painéis com comportamento responsivo desktop/mobile.

**Tarefas**
- [ ] Grid CSS de 3 colunas no desktop (`ConfigPanel`, `SimulationCanvas`, `ImpactPanel`) com estado em `page.jsx`
- [ ] Painéis laterais minimizáveis no desktop para focar no grid
- [ ] Tab bar fixa inferior no mobile (Configuração / Grid / Impacto)
- [ ] Garantir que a simulação roda em background no mobile quando outra aba estiver ativa
- [ ] Slider de velocidade conectado ao contador de ticks lógicos

**Critério de aceite:** fluxo completo configurar → plantar → observar → ver impacto, responsivo em desktop e mobile.

---

## Sprint 6 — Controles de Simulação & Export de Card PNG

**Objetivo:** ciclo de vida de controle (reiniciar, finalizar) e exportação de resultado.

**Tarefas**
- [ ] Botão **Reiniciar**: reseta grid, agentes e contadores
- [ ] Botão **Finalizar**: modal de confirmação antes de pausar
- [ ] Geração de **card PNG compartilhável**:
  - Título no topo
  - Screenshot do estado final do grid
  - Impacto acumulado (O2 / CO2)
- [ ] Download da imagem gerada

**Critério de aceite:** usuário consegue reiniciar a qualquer momento ou finalizar e baixar a imagem de resultado.

---

## Sprint 7 — Balanceamento & Polimento

**Objetivo:** ajuste fino de gameplay visual, estabilidade e performance.

**Tarefas**
- [ ] Ajustar tempos de crescimento/propagação para ritmo visual agradável
- [ ] Otimização de performance com matriz saturada (muitas plantas e agentes simultâneos)
- [ ] Feedback visual de plantio, estados vazios e transições suaves
- [ ] Revisão de responsividade em tablets e resoluções intermediárias

**Critério de aceite:** simulação estável com grid cheio a 60 FPS, sem travamentos.

---

## Sprint 8 (Opcional) — Extras Futuros

**Tarefas**
- [ ] Persistência da simulação em `localStorage`
- [ ] Medidor temático de "aquecimento global"
- [ ] Design refinado do card de finalização (tipografia e arte)
- [ ] Efeitos sonoros
- [ ] Tutorial interativo de onboarding

---

## Notas de Dependência

1. **Sprint 1 (MVP)** é o marco fundamental do projeto: com ele pronto, temos um autômato celular já jogável e interativo.
2. As Sprints da **Fase 2** agregam valor incremental sem quebrar o motor básico validado no MVP.