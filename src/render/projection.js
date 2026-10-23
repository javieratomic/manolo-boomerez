// Proyección del mapa 2.5D ("maqueta inclinada"): lon/lat -> coordenadas de mundo en píxeles.
// El arte de assets/map/map_spain.png DEBE respetar esta calibración (ver art/requests/02_mapa.md).

export const WORLD = {
  width: 2048,
  height: 1088,
  minLon: -9.5,
  maxLat: 44.0,
  pxPerLonDeg: 145.5, // ≈ cos(40°) · 190
  pxPerLatDeg: 117.8, // 190 · 0.62 (inclinación de la cámara)
  offsetX: 6,
  offsetY: 40,
  extrude: 14, // grosor de la "maqueta" en píxeles
};

export function project(lon, lat) {
  return {
    x: (lon - WORLD.minLon) * WORLD.pxPerLonDeg + WORLD.offsetX,
    y: (WORLD.maxLat - lat) * WORLD.pxPerLatDeg + WORLD.offsetY,
  };
}

export function unproject(x, y) {
  return {
    lon: (x - WORLD.offsetX) / WORLD.pxPerLonDeg + WORLD.minLon,
    lat: WORLD.maxLat - (y - WORLD.offsetY) / WORLD.pxPerLatDeg,
  };
}
