export interface ElectricBorderPoint { x: number; y: number; nx: number; ny: number; distance: number }

/** Samples a true rounded perimeter once per resize, not once per frame. */
export function createElectricBorderPoints(width: number, height: number, radius: number): ElectricBorderPoint[] {
  const inset = 7;
  const w = Math.max(1, width - inset * 2);
  const h = Math.max(1, height - inset * 2);
  const r = Math.min(Math.max(0, radius), w / 2, h / 2);
  const segments = [
    { length: w - 2 * r, point: (t: number) => [inset + r + t, inset, 0, -1] },
    { length: Math.PI * r / 2, point: (t: number) => arc(inset + w - r, inset + r, -Math.PI / 2 + t / (r || 1)) },
    { length: h - 2 * r, point: (t: number) => [inset + w, inset + r + t, 1, 0] },
    { length: Math.PI * r / 2, point: (t: number) => arc(inset + w - r, inset + h - r, t / (r || 1)) },
    { length: w - 2 * r, point: (t: number) => [inset + w - r - t, inset + h, 0, 1] },
    { length: Math.PI * r / 2, point: (t: number) => arc(inset + r, inset + h - r, Math.PI / 2 + t / (r || 1)) },
    { length: h - 2 * r, point: (t: number) => [inset, inset + h - r - t, -1, 0] },
    { length: Math.PI * r / 2, point: (t: number) => arc(inset + r, inset + r, Math.PI + t / (r || 1)) },
  ];
  function arc(cx: number, cy: number, angle: number) {
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    return [cx + r * nx, cy + r * ny, nx, ny];
  }
  const perimeter = segments.reduce((sum, segment) => sum + segment.length, 0);
  const count = Math.min(800, Math.max(32, Math.ceil(perimeter / 3)));
  const points: ElectricBorderPoint[] = [];
  for (let i = 0; i < count; i++) {
    const distance = i / count * perimeter;
    let remaining = distance;
    for (const segment of segments) {
      if (remaining <= segment.length && segment.length > 0) {
        const [x, y, nx, ny] = segment.point(remaining);
        points.push({ x, y, nx, ny, distance });
        break;
      }
      remaining -= segment.length;
    }
  }
  return points;
}

/** Draw a thin irregular core, warm bloom, traveling arcs and sparse sparks. */
export function drawElectricBorder(ctx: CanvasRenderingContext2D, points: ElectricBorderPoint[], time: number, intensity: number, color: string, reducedMotion: boolean, coordinates = new Float32Array(points.length * 2)) {
  if (!points.length) return;
  const t = reducedMotion ? 0 : time;
  const count = points.length;
  const epoch = Math.floor(t * 9);
  const blend = t * 9 - epoch;
  const easedBlend = blend * blend * (3 - 2 * blend);
  function noiseAt(distance: number, phase: number) {
    const value = Math.sin(distance * 12.9898 + phase * 78.233) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }
  for (let i = 0; i < count; i++) {
    const point = points[i];
    const d = point.distance;
    const noise = reducedMotion ? 0 : (noiseAt(d, epoch) * (1 - easedBlend) + noiseAt(d, epoch + 1) * easedBlend) * 1.9 + Math.sin(d * 0.11 + t * 2.3) * 0.6;
    coordinates[i * 2] = point.x + point.nx * noise * intensity;
    coordinates[i * 2 + 1] = point.y + point.ny * noise * intensity;
  }
  function path() {
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      if (i) ctx.lineTo(coordinates[i * 2], coordinates[i * 2 + 1]);
      else ctx.moveTo(coordinates[0], coordinates[1]);
    }
    ctx.closePath();
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  path();
  ctx.globalAlpha = 0.24 * intensity;
  ctx.strokeStyle = "#FF7A18";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "#FF7A18";
  ctx.shadowBlur = reducedMotion ? 4 : 12;
  ctx.stroke();
  ctx.globalAlpha = (0.52 + Math.sin(t * 3.7) * 0.07) * intensity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.15;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.stroke();
  if (!reducedMotion) {
    // Sparse frayed filaments separate briefly from the core and rejoin it.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.6;
    for (let filament = 0; filament < 6; filament++) {
      const start = Math.floor(((t * 0.019 + filament * 0.163) % 1) * count);
      ctx.globalAlpha = (0.2 + Math.max(0, Math.sin(t * 2.7 + filament * 2.3)) * 0.3) * intensity;
      ctx.beginPath();
      for (let j = 0; j < 9; j++) {
        const index = (start + j) % count;
        const point = points[index];
        const spread = Math.sin(j / 8 * Math.PI) * (2.5 + noiseAt(point.distance, epoch) * 1.5) * intensity;
        const x = coordinates[index * 2] + point.nx * spread;
        const y = coordinates[index * 2 + 1] + point.ny * spread;
        if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    for (let arc = 0; arc < 4; arc++) {
      const head = ((t * (0.06 + arc * 0.013) + arc * 0.237 + Math.sin(t * 0.8 + arc) * 0.018) % 1) * count;
      const length = 8 + Math.floor((Math.sin(t * 1.7 + arc * 3.1) + 1) * 8);
      ctx.beginPath();
      for (let j = 0; j < length; j++) {
        const index = (Math.floor(head) + j) % count * 2;
        if (j) ctx.lineTo(coordinates[index], coordinates[index + 1]); else ctx.moveTo(coordinates[index], coordinates[index + 1]);
      }
      ctx.globalAlpha = (0.55 + Math.sin(t * 5.3 + arc * 2.1) * 0.2) * intensity;
      ctx.strokeStyle = arc % 2 ? "#FFD27A" : "#FFF1C1";
      ctx.lineWidth = 1.25;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.stroke();
    }
    for (let spark = 0; spark < 7; spark++) {
      const pulse = Math.max(0, Math.sin(t * (2.1 + spark * 0.31) + spark * 5.3) - 0.65) / 0.35;
      if (!pulse) continue;
      const index = Math.floor(((t * (0.017 + spark * 0.003) + spark * 0.149) % 1) * count);
      const x = coordinates[index * 2];
      const y = coordinates[index * 2 + 1];
      const normal = points[index];
      const reach = (3 + spark % 3 * 1.8) * pulse * intensity;
      ctx.globalAlpha = pulse * 0.8 * intensity;
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = "#FFD27A";
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + normal.nx * reach * 0.55 - normal.ny * 2, y + normal.ny * reach * 0.55 + normal.nx * 2);
      ctx.lineTo(x + normal.nx * reach, y + normal.ny * reach);
      ctx.stroke();
      ctx.fillStyle = "#FFF1C1";
      ctx.fillRect(x + normal.nx * reach - 0.5, y + normal.ny * reach - 0.5, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}
