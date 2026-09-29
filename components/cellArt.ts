/**
 * cellArt — ilustração de dentro das células do mapa.
 *
 * Usado pelo canvas (SimulationCanvas) e pela legenda/pincéis (MapSymbol),
 * para que os dois fiquem idênticos. Regime "dentro da célula" do DESIGN.md:
 * volume, vários tons e degradê sutil são permitidos AQUI, com 4 limites:
 *
 * 1. Leitura do estado: o detalhe fica por cima do fundo chapado do estado
 *    (desenhado pelo chamador com CELL_COLORS) e mantém a escada de L*.
 * 2. Tamanho real: abaixo de DETAIL_THRESHOLD_PX por célula na tela, usa-se
 *    o desenho "simple" (formas maiores, menos tons).
 * 3. Determinismo: a variante vem de cellVariant(col, row). Nada de
 *    Math.random() aqui.
 * 4. Custo: as variantes são pré-renderizadas uma vez num atlas
 *    (getCellAtlas) e o loop só faz drawImage.
 *
 * Todas as funções de desenho trabalham numa caixa de 20 × 20 com origem
 * no canto superior esquerdo da célula.
 */

import { CellState } from '@/lib/types';
import { AGENT_COLOR, AGENT_SEED_COLOR, CELL_COLORS, UI_COLORS } from '@/lib/constants';

export type Detail = 'full' | 'simple';

const SIZE = 20;
export const VARIANTS = 4;
/** Abaixo disso (px de tela por célula), o desenho "full" vira borrão */
export const DETAIL_THRESHOLD_PX = 14;

// Ordem das linhas no atlas
const STATES: CellState[] = [
  CellState.LEITO_AGUA,
  CellState.LEITO_SECO,
  CellState.SOLO_FERTIL,
  CellState.SOLO_SECO,
  CellState.SEMENTE,
  CellState.BROTO,
  CellState.ARVORE_ADULTA,
];
export const STATE_ROW = Object.fromEntries(STATES.map((s, i) => [s, i])) as Record<CellState, number>;

// Tons de apoio, todos derivados das cores do estado
const TONE = {
  treeLight: '#528C52',
  treeBody: '#33653D',
  treeShadow: '#1F4228',
  treeTrunk: '#4A3320',
  leafDark: '#35692F',
  leafMid: '#4A8A40',
  stem: '#3E6B35',
  seedLight: '#F3DDA6',
  seedEdge: '#B98A3E',
  seedSeam: '#9C7432',
  waterDeep: '#17637E',
  shallow: '#7FB3C4',
  pebbleDark: '#8E958A',
  pebbleLight: '#C3C8BC',
  wetSpeckDark: '#86592B',
  wetSpeckLight: '#AE7A42',
  drySpeckDark: '#C2AE80',
  drySpeckLight: '#E2D3AE',
  groundShadow: 'rgba(23, 38, 31, 0.28)',
  wing: 'rgba(232, 240, 236, 0.6)',
  wingEdge: 'rgba(23, 38, 31, 0.35)',
  trail: 'rgba(23, 38, 31, 0.18)',
  stripe: 'rgba(23, 38, 31, 0.75)',
};

/** Variante 0..VARIANTS-1, estável para cada coordenada */
export function cellVariant(col: number, row: number): number {
  let h = Math.imul(col + 1, 374761393) ^ Math.imul(row + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) % VARIANTS;
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function crown(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Sombra curta no chão, deslocada 1px
  dot(ctx, cx + 1, cy + 1.5, r, TONE.groundShadow);
  // Copa com luz vinda de cima à esquerda
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r);
  g.addColorStop(0, TONE.treeLight);
  g.addColorStop(0.55, TONE.treeBody);
  g.addColorStop(1, TONE.treeShadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  angle: number,
  color: string | CanvasGradient,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

function drawTree(ctx: CanvasRenderingContext2D, v: number, detail: Detail) {
  if (detail === 'simple') {
    // Formas grandes, mas ainda variando por célula, senão a mata vira
    // papel-bolha no mobile
    const ox = [0, 1.2, -1, 0.6][v];
    const oy = [0, -0.8, 1, 1.2][v];
    const r = [6.5, 6, 7, 5.8][v];
    dot(ctx, 11 + ox, 11 + oy, r + 1, TONE.treeShadow);
    dot(ctx, 9.5 + ox, 9.5 + oy, r, TONE.treeBody);
    dot(ctx, 8 + ox, 8 + oy, 2.5, TONE.treeLight);
    return;
  }
  switch (v) {
    case 0: // copa única com tronco
      ctx.fillStyle = TONE.treeTrunk;
      ctx.fillRect(9, 13, 2, 6);
      crown(ctx, 10, 9, 7);
      break;
    case 1: // duas copas
      crown(ctx, 7.5, 11.5, 5.5);
      crown(ctx, 12.5, 8, 6);
      break;
    case 2: // três copas pequenas
      crown(ctx, 6.5, 7.5, 4.5);
      crown(ctx, 13.5, 8.5, 5);
      crown(ctx, 9.5, 13.5, 5);
      break;
    default: // copa grande e uma menor atrás
      crown(ctx, 6, 6, 3.5);
      crown(ctx, 11, 10.5, 7);
      break;
  }
}

function drawSprout(ctx: CanvasRenderingContext2D, v: number, detail: Detail) {
  if (detail === 'simple') {
    // Mais claro que o completo: em ~11px as folhas escuras puxavam o L*
    // do broto para o nível da semente
    ctx.strokeStyle = TONE.leafMid;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, 17);
    ctx.lineTo(10, 9);
    ctx.stroke();
    leaf(ctx, 6.8, 8.5, 3.4, 1.8, -0.6, TONE.leafMid);
    leaf(ctx, 13.2, 8.5, 3.4, 1.8, 0.6, TONE.leafMid);
    return;
  }
  const lean = [-1, 0.5, 1, -0.5][v];
  const top = [7, 6, 8, 6.5][v];
  // Montinho de terra na base
  leaf(ctx, 10, 17, 4, 1.4, 0, TONE.groundShadow);
  // Caule levemente curvo
  ctx.strokeStyle = TONE.stem;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, 17);
  ctx.quadraticCurveTo(10 + lean, 12, 10 + lean * 0.5, top);
  ctx.stroke();
  // Folhas: duas sempre, uma terceira em metade das variantes
  const tipX = 10 + lean * 0.5;
  leaf(ctx, tipX - 3.2, top + 2.5, 3.4, 1.6, -0.55, TONE.leafDark);
  leaf(ctx, tipX + 3.2, top + 1.8, 3.4, 1.6, 0.55, TONE.leafMid);
  if (v % 2 === 1) leaf(ctx, tipX - 2.4, top + 6.5, 2.6, 1.3, -0.3, TONE.leafMid);
}

function drawSeed(ctx: CanvasRenderingContext2D, v: number, detail: Detail) {
  if (detail === 'simple') {
    leaf(ctx, 10.4, 10.8, 3.6, 2.6, 0.4, TONE.seedEdge);
    leaf(ctx, 10, 10.4, 3.2, 2.2, 0.4, AGENT_SEED_COLOR);
    return;
  }
  const angle = [-0.5, 0.3, 0.9, -1.1][v];
  const ox = [0, 1, -1, 0.5][v];
  const oy = [0, -1, 0.5, 1][v];
  const cx = 10 + ox;
  const cy = 10 + oy;
  leaf(ctx, cx + 0.8, cy + 1.4, 3.4, 1.8, angle, TONE.groundShadow);
  const g = ctx.createRadialGradient(cx - 1.2, cy - 1, 0.3, cx, cy, 3.4);
  g.addColorStop(0, TONE.seedLight);
  g.addColorStop(0.6, AGENT_SEED_COLOR);
  g.addColorStop(1, TONE.seedEdge);
  leaf(ctx, cx, cy, 3.3, 2.3, angle, g);
  // Sulco da semente
  ctx.strokeStyle = TONE.seedSeam;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 2.2, 0.01, angle, 0, Math.PI * 2);
  ctx.stroke();
}

function drawWater(ctx: CanvasRenderingContext2D, v: number, detail: Detail) {
  ctx.strokeStyle = TONE.shallow;
  ctx.lineCap = 'round';
  if (detail === 'simple') {
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(4, 10);
    ctx.quadraticCurveTo(10, 7, 16, 10);
    ctx.stroke();
    return;
  }
  // Mancha de fundo mais funda
  leaf(ctx, [6, 13, 9, 12][v], [13, 6, 9, 14][v], 5, 3, 0.3, TONE.waterDeep);
  // Duas ondulações curtas
  ctx.lineWidth = 1.2;
  const rows = [
    [3, 6, 11, 14],
    [8, 4, 3, 12],
    [5, 8, 10, 15],
    [9, 5, 2, 13],
  ][v];
  ctx.beginPath();
  ctx.moveTo(rows[0], rows[1]);
  ctx.quadraticCurveTo(rows[0] + 3, rows[1] - 1.5, rows[0] + 6, rows[1]);
  ctx.moveTo(rows[2], rows[3]);
  ctx.quadraticCurveTo(rows[2] + 3, rows[3] - 1.5, rows[2] + 6, rows[3]);
  ctx.stroke();
}

function drawDryRiver(ctx: CanvasRenderingContext2D, v: number, detail: Detail) {
  // Convenção de rio intermitente: tracejado na cor do rio
  ctx.strokeStyle = CELL_COLORS[CellState.LEITO_AGUA];
  ctx.lineWidth = detail === 'simple' ? 2 : 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(1, 10);
  ctx.lineTo(19, 10);
  ctx.stroke();
  ctx.setLineDash([]);
  if (detail === 'simple') return;
  // Cascalho
  const p = [
    [4, 5, 15, 15, 12, 4],
    [7, 15, 16, 5, 3, 14],
    [14, 4, 5, 14, 16, 16],
    [3, 15, 12, 5, 8, 16],
  ][v];
  dot(ctx, p[0], p[1], 1, TONE.pebbleDark);
  dot(ctx, p[2], p[3], 0.9, TONE.pebbleLight);
  dot(ctx, p[4], p[5], 0.8, TONE.pebbleDark);
}

function specks(ctx: CanvasRenderingContext2D, v: number, dark: string, light: string) {
  const p = [
    [3, 4, 14, 7, 8, 15, 16, 16],
    [6, 3, 16, 11, 4, 13, 11, 17],
    [12, 3, 3, 9, 15, 15, 9, 11],
    [5, 7, 13, 4, 10, 16, 17, 12],
  ][v];
  dot(ctx, p[0], p[1], 0.8, dark);
  dot(ctx, p[2], p[3], 0.7, light);
  dot(ctx, p[4], p[5], 0.8, dark);
  dot(ctx, p[6], p[7], 0.7, light);
}

function drawWetSoil(ctx: CanvasRenderingContext2D, v: number, detail: Detail) {
  if (detail === 'simple') return;
  specks(ctx, v, TONE.wetSpeckDark, TONE.wetSpeckLight);
}

function drawDrySoil(ctx: CanvasRenderingContext2D, v: number, detail: Detail) {
  if (detail === 'simple') return;
  specks(ctx, v, TONE.drySpeckDark, TONE.drySpeckLight);
  if (v === 3) {
    // Rachadura fina
    ctx.strokeStyle = TONE.drySpeckDark;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(3, 12);
    ctx.lineTo(7, 10);
    ctx.lineTo(10, 12);
    ctx.stroke();
  }
}

/** Desenha o detalhe de um estado (sem o fundo chapado) na caixa 20 × 20 */
export function drawCellArt(ctx: CanvasRenderingContext2D, state: CellState, v: number, detail: Detail) {
  ctx.save();
  switch (state) {
    case CellState.ARVORE_ADULTA:
      drawTree(ctx, v, detail);
      break;
    case CellState.BROTO:
      drawSprout(ctx, v, detail);
      break;
    case CellState.SEMENTE:
      drawSeed(ctx, v, detail);
      break;
    case CellState.LEITO_AGUA:
      drawWater(ctx, v, detail);
      break;
    case CellState.LEITO_SECO:
      drawDryRiver(ctx, v, detail);
      break;
    case CellState.SOLO_FERTIL:
      drawWetSoil(ctx, v, detail);
      break;
    case CellState.SOLO_SECO:
      drawDrySoil(ctx, v, detail);
      break;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Atlas pré-renderizado (limite 4: custo)
// ---------------------------------------------------------------------------

const atlases: Partial<Record<Detail, HTMLCanvasElement>> = {};

/** Atlas com uma linha por estado (STATE_ROW) e uma coluna por variante */
export function getCellAtlas(detail: Detail): HTMLCanvasElement {
  let atlas = atlases[detail];
  if (!atlas) {
    atlas = document.createElement('canvas');
    atlas.width = VARIANTS * SIZE;
    atlas.height = STATES.length * SIZE;
    const g = atlas.getContext('2d')!;
    STATES.forEach((state, row) => {
      for (let v = 0; v < VARIANTS; v++) {
        g.save();
        g.translate(v * SIZE, row * SIZE);
        g.beginPath();
        g.rect(0, 0, SIZE, SIZE);
        g.clip();
        drawCellArt(g, state, v, detail);
        g.restore();
      }
    });
    atlases[detail] = atlas;
  }
  return atlas;
}

// ---------------------------------------------------------------------------
// Polinizador (desenhado a cada quadro: orientação e asas mudam)
// ---------------------------------------------------------------------------

export function drawPollinator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vx: number,
  vy: number,
  hasSeed: boolean,
  frame: number,
  id: number,
  detail: Detail,
) {
  if (detail === 'simple') {
    ctx.fillStyle = AGENT_COLOR;
    ctx.strokeStyle = UI_COLORS.textPrimary;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (hasSeed) {
      dot(ctx, x + 5, y + 4, 2.8, AGENT_SEED_COLOR);
    }
    return;
  }

  const angle = Math.atan2(vy, vx) || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Rastro curto
  dot(ctx, -7, 0, 1.5, TONE.trail);
  dot(ctx, -11, 0, 1, TONE.trail);

  // Semente carregada, presa embaixo do corpo
  if (hasSeed) {
    leaf(ctx, -2, 3.2, 2.2, 1.5, 0, TONE.seedEdge);
    leaf(ctx, -2, 3, 1.9, 1.2, 0, AGENT_SEED_COLOR);
  }

  // Asas batendo (movimento real: o polinizador está voando)
  const flap = 3 + Math.sin(frame * 0.45 + id) * 1.2;
  ctx.fillStyle = TONE.wing;
  ctx.strokeStyle = TONE.wingEdge;
  ctx.lineWidth = 0.6;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(-0.5, side * (flap * 0.7), 2.8, flap * 0.6, side * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Corpo com volume
  const g = ctx.createRadialGradient(-0.8, -1, 0.4, 0, 0, 4.2);
  g.addColorStop(0, '#F2C457');
  g.addColorStop(0.6, AGENT_COLOR);
  g.addColorStop(1, '#B97F10');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Listras e cabeça
  ctx.strokeStyle = TONE.stripe;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-1.5, -2.4);
  ctx.lineTo(-1.5, 2.4);
  ctx.moveTo(0.8, -2.7);
  ctx.lineTo(0.8, 2.7);
  ctx.stroke();
  dot(ctx, 4, 0, 1.5, UI_COLORS.textPrimary);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Camada de células (limite 4: custo)
// ---------------------------------------------------------------------------
// O mapa só muda num tick ou numa pincelada. Em vez de redesenhar as 768
// células a cada quadro, mantemos uma camada offscreen e redesenhamos só as
// células cujo estado mudou (ou todas, se o nível de detalhe mudar).

interface CellLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  states: (CellState | undefined)[];
  detail: Detail | null;
}

const layers = new WeakMap<HTMLCanvasElement, CellLayer>();

/**
 * Atualiza e devolve a camada de células de um canvas de mapa.
 * `grid[row][col].state` é tudo que o desenho usa.
 */
export function updateCellLayer(
  owner: HTMLCanvasElement,
  grid: ReadonlyArray<ReadonlyArray<{ state: CellState }>>,
  detail: Detail,
): HTMLCanvasElement {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let layer = layers.get(owner);
  if (!layer || layer.canvas.width !== cols * SIZE || layer.canvas.height !== rows * SIZE) {
    const canvas = document.createElement('canvas');
    canvas.width = cols * SIZE;
    canvas.height = rows * SIZE;
    layer = { canvas, ctx: canvas.getContext('2d')!, states: [], detail: null };
    layers.set(owner, layer);
  }
  if (layer.detail !== detail) {
    layer.states = [];
    layer.detail = detail;
  }

  const atlas = getCellAtlas(detail);
  const { ctx, states } = layer;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const state = grid[r][c].state;
      const i = r * cols + c;
      if (states[i] === state) continue;
      states[i] = state;
      const x = c * SIZE;
      const y = r * SIZE;
      // Fundo chapado do estado + ilustração da variante
      ctx.fillStyle = CELL_COLORS[state];
      ctx.fillRect(x, y, SIZE, SIZE);
      ctx.drawImage(atlas, cellVariant(c, r) * SIZE, STATE_ROW[state] * SIZE, SIZE, SIZE, x, y, SIZE, SIZE);
    }
  }
  return layer.canvas;
}
