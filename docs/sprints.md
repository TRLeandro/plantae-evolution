# Plantae Evolution 🌱 — Roadmap de Desenvolvimento (Sprints)

> Baseado em `README.md`. Estruturado em duas fases: **Fase 1 (MVP)** com foco em ter o autômato funcional rodando com apenas 1 planta e 1 agente polinizador, seguido da **Fase 2 (Incrementos)** para expandir o ecossistema até o estado planejado.

---

# 🚀 FASE 1: MVP do Autômato Funcional
*Objetivo da fase: Obter a menor versão jogável e autônoma da simulação (1 planta + 1 agente), validando o ciclo completo de plantio, crescimento e propagação.*

---

## Sprint 0 — Setup & Integração Base

**Objetivo:** validar a integração p5.js ↔ Next.js com canvas interativo básico.

**Tarefas**
- [x] Inicializar projeto Next.js + Tailwind CSS
- [x] Integrar p5.js em **modo instância** via `react-p5-wrapper` (ou import dinâmico client-side)
- [x] Renderizar grid estático no canvas
- [x] Capturar clique em uma célula (identificar coordenadas da matriz)

**Critério de aceite:** p5 roda dentro do componente React sem erros de hidratação/SSR e exibe o grid clicável com registro preciso de coordenadas.

---

## Sprint 1 — Motor do MVP (Espécie Única + Agente Único)

**Objetivo:** ciclo completo de vida e propagação autônoma com a máxima simplicidade (1 espécie + 1 agente polinizador).

**Tarefas**
- [x] **Estrutura de dados do grid:** matriz de células `{ estado, tipoPlanta, idade }`
- [x] **Sistema de ticks lógicos:** controle de tempo desacoplado do `frameRate()` do p5
- [x] **Ciclo de vida da planta única:** semente → crescendo → madura (ciclo infinito, não morre)
- [ ] **Agente polinizador único (ex: Vento 🍃):** estrutura de agente com posição e movimentação na matriz
- [ ] **Mecanismo de propagação e colisão simplificado:**
  - Planta madura gera oportunidade de reprodução
  - Agente propaga semente para célula vazia no seu alcance
  - Colisão básica: se célula ocupada, encerra tentativa ou tenta célula vizinha
- [x] **Plantio manual:** clique no grid planta a semente inicial

**Critério de aceite do MVP:** usuário clica para plantar uma semente; a planta cresce até a maturidade; o agente polinizador se move pela matriz e propaga sementes; novas plantas nascem e se espalham de forma autônoma pela matriz.

---

# 🌿 FASE 2: Incrementos & Refinamento do Sistema

---

## Sprint 2 — Catálogo de Espécies & Dispersão por Autômato Celular

**Objetivo:** expandir de 1 para 4 espécies evolutivas com características, ritmos e regras de dispersão distintas: Briófitas (autômato celular puro sem agentes), Pteridófitas (somente vento), Gimnospermas (vento e pássaro) e Angiospermas (todos os agentes).

**Tarefas**
- [ ] Modelagem de dados por espécie (tempo de crescimento, tipo de reprodução: esporo / semente / flor-fruto, matriz de agentes compatíveis)
- [ ] Implementar expansão autônoma das briófitas por autômato celular (colonização direta de casas adjacentes durante floração)
- [ ] Painel seletor de espécies antes do plantio (Briófita, Pteridófita, Gimnosperma, Angiosperma)
- [ ] Renderização visual distinta por espécie no grid com cores madura e reprodutiva

**Critério de aceite:** o usuário pode alternar entre as 4 espécies antes de plantar; briófitas se expandem sozinhas para células vizinhas como autômato puro, enquanto pteridófitas, gimnospermas e angiospermas dependem dos seus respectivos agentes polinizadores.

---

## Sprint 3 — Agentes Polinizadores Completos & Especialização de Dispersão

**Objetivo:** adicionar os agentes restantes (Pássaro e Abelha) e consolidar as regras de colisão e especialização por espécie.

**Tarefas**
- [ ] Implementar agente **Pássaro 🐦** (dispersão de frutos/sementes para Gimnospermas e Angiospermas)
- [ ] Implementar agente **Abelha 🐝** (polinização focada de flores para Angiospermas)
- [ ] Filtragem de dispersão por espécie (Vento atua em Pteridófitas, Gimnospermas e Angiospermas; Pássaro em Gimnospermas e Angiospermas; Abelha em Angiospermas)
- [ ] **Regra completa de colisão de propagação** (para os 3 agentes):
  - Célula vazia → propaga normalmente
  - Célula ocupada em reprodução → sucesso silencioso (agente encerra ali)
  - Célula ocupada em crescimento → bloqueio real, tenta mais 2 células
  - 3 tentativas falhas → sem propagação no tick, agente segue movimento

**Critério de aceite:** os 3 agentes coexistem na simulação com alcances distintos e comportamento seletivo conforme a matriz de dispersão de cada espécie.

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