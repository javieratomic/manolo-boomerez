// Colocación de rótulos del mapa en coordenadas de pantalla (función pura): por prioridad, y el que se
// pisa con uno ya colocado no se dibuja.
// items: [{ id, x, y, w, h, priority }] con (x, y) el centro superior del rótulo.
export function layoutLabels(items, pad = 2) {
  const placed = [];
  for (const it of [...items].sort((a, b) => b.priority - a.priority)) {
    const box = { x0: it.x - it.w / 2 - pad, x1: it.x + it.w / 2 + pad, y0: it.y - pad, y1: it.y + it.h + pad };
    if (placed.some((p) => box.x0 < p.box.x1 && box.x1 > p.box.x0 && box.y0 < p.box.y1 && box.y1 > p.box.y0)) continue;
    placed.push({ ...it, box });
  }
  return placed;
}
