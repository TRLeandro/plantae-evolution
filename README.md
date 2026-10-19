# Plantae Evolution

Simulador ecológico interativo para estudantes e pessoas interessadas em explorar como a mata ciliar, a chuva e a dispersão de sementes influenciam a preservação de uma bacia hidrográfica.

## Por quê ?

A relação entre desmatamento, disponibilidade de água e regeneração da vegetação pode ser difícil de visualizar apenas com explicações teóricas. O projeto transforma essas relações em um autômato celular: é possível plantar, desmatar e alterar o rio para observar como o ecossistema responde às estações de chuva e estiagem.

## Features

- Mapa interativo de 32 × 24 células, com pincéis para plantar árvores e sementes, desmatar, criar ou secar trechos de rio, aplicar terra seca e inspecionar células.
- Alternância entre chuva e estiagem, com evaporação, recuperação do rio e proteção da água pela mata ciliar.
- Ciclo de crescimento de sementes, brotos e árvores, com dispersão de sementes por agentes móveis.
- Nuvens que se deslocam pelo mapa, umedecem o solo e ajudam na germinação e na sobrevivência dos brotos.
- Quatro cenários iniciais: Mata preservada, Margens desmatadas, Em recuperação e Terra seca.
- Controles para pausar, continuar, avançar um tick e reiniciar, além de ajustes de velocidade, alcance da água e quantidade de polinizadores.
- Indicadores de preservação do rio, proteção pela mata, germinação e dispersão de sementes, com interface adaptada a desktop e celular.

A simulação usa regras simplificadas para exploração visual. O estado fica em memória e é recriado ao recarregar a página.

## Tech stack

- **Next.js 16** com App Router e **React 19** para a aplicação web.
- **TypeScript** em modo estrito para o código e os tipos da simulação.
- **Canvas 2D nativo** para desenhar o mapa, os agentes e as nuvens.
- **Tailwind CSS 4** para a interface e os tokens visuais.
- **Vitest 5** para testes automatizados e **ESLint 9** para análise estática.

O p5.js permanece como dependência do motor legado e de seus testes; a página atual usa Canvas 2D. A simulação roda no navegador, sem banco de dados ou chaves de API.

## Como Executar

1. Instale **Node.js 24** e npm. Para desenvolvimento e testes, o projeto também é compatível com Node.js 22 a partir da versão 22.12.
2. Clone o repositório e entre na pasta do projeto.
3. Instale as dependências:

   ```bash
   npm ci
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Abra [localhost:3000](http://localhost:3000).

Escolha um pincel e clique ou arraste sobre o mapa. O botão de engrenagem abre os cenários, os ajustes e as métricas sem pausar a simulação.

Para gerar e servir a versão de produção:

```bash
npm run build
npm start
```

A compilação precisa de acesso ao Google Fonts para obter as fontes IBM Plex Sans e IBM Plex Sans Condensed, usadas por `next/font/google`.

## Testes

Depois de instalar as dependências, execute a suíte de testes:

```bash
npm test
```

Para executar novamente os testes a cada alteração:

```bash
npm run test:watch
```

Os testes em `lib/__tests__/` cobrem hidratação, evaporação, estações, dispersão de sementes e nuvens do motor atual, além de grade, ticks, ciclo de vida, vento e polinização do motor legado.

Para verificar também o estilo do código e os tipos:

```bash
npm run lint
npx tsc --noEmit
```

## Aprendizados

Algumas decisões e desafios técnicos que o projeto evidencia:

- **Separar simulação e interface:** as regras ficam em `lib/engine.ts`, enquanto o Canvas desenha e recebe interações. Isso permite testar o comportamento do ecossistema sem depender da interface.
- **Separar ticks e animação:** o crescimento e as mudanças do terreno avançam em passos lógicos, enquanto agentes e nuvens se movem a cada quadro visual.
- **Limitar a sincronização com React:** as métricas são enviadas a cada 15 quadros visuais, evitando atualizar o estado da interface a cada quadro de animação.
- **Controlar a aleatoriedade nos testes:** cenários e eventos usam probabilidades; os testes controlam `Math.random` para verificar regras e limites de forma reproduzível.
- **Manter a documentação alinhada à implementação:** o planejamento histórico inclui múltiplas espécies e contadores de O₂/CO₂, que não fazem parte da interface atual.

Uma melhoria para uma próxima versão seria permitir salvar e reproduzir um cenário com a mesma sequência aleatória, facilitando comparar intervenções no ecossistema.

As decisões visuais estão em [DESIGN.md](DESIGN.md), a paleta em [docs/palette.md](docs/palette.md) e o planejamento histórico em [docs/sprints.md](docs/sprints.md).
