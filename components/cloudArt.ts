/** Desenho das nuvens preservado da branch mudancas-adicionadas-gustavo-samuel. */
import type { Cloud } from '@/lib/types';
import { CLOUD_COLORS } from '@/lib/constants';

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: readonly Cloud[],
  visualFrameCount: number,
): void {
  for (const cl of clouds) {
    const r = cl.radius;
    const x = cl.x;
    const y = cl.y;

    // Sombra suave de umidade no solo
    ctx.fillStyle = CLOUD_COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.7, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gotas de chuva caindo abaixo da nuvem
    ctx.strokeStyle = CLOUD_COLORS.rain;
    ctx.lineWidth = 1.5;
    const dropSpacing = r * 0.42;
    for (let i = -1; i <= 1; i++) {
      const dropX = x + i * dropSpacing;
      const dropOffset = (visualFrameCount * 1.8 + cl.id * 11 + (i + 1) * 7) % 20;
      ctx.beginPath();
      ctx.moveTo(dropX, y + r * 0.35 + dropOffset);
      ctx.lineTo(dropX - 0.5, y + r * 0.35 + dropOffset + 4.5);
      ctx.stroke();
    }

    // Halo atmosférico azul claro
    ctx.fillStyle = CLOUD_COLORS.halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Corpo fofo e volumoso da nuvem (círculos sobrepostos)
    ctx.fillStyle = CLOUD_COLORS.body;

    // Puf central superior
    ctx.beginPath();
    ctx.arc(x, y - r * 0.15, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Puf lateral esquerdo
    ctx.beginPath();
    ctx.arc(x - r * 0.4, y + r * 0.05, r * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Puf lateral direito
    ctx.beginPath();
    ctx.arc(x + r * 0.4, y + r * 0.05, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Puf base alargada
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.15, r * 0.65, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Destaque branco superior (iluminação solar)
    ctx.fillStyle = CLOUD_COLORS.highlight;
    ctx.beginPath();
    ctx.arc(x - r * 0.12, y - r * 0.26, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
}
